-- World Memories: initial schema (spec §5).
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- Access model: sign-ups are disabled in Supabase Auth, so every `authenticated`
-- user is an invited member. Members can read everything and edit every pin.
-- The `anon` role (logged-out visitors) gets nothing.

-- ---------------------------------------------------------------------------
-- profiles: one row per member, holding the display name shown on pins.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 50),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- pins
-- created_by / updated_by reference profiles (not auth.users) so the API can
-- embed the author's display name: select *, author:profiles!created_by(display_name)
-- ---------------------------------------------------------------------------
create table public.pins (
  id          uuid primary key default gen_random_uuid(),
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  place_name  text check (char_length(place_name) <= 200),
  emoji       text not null default '📍' check (char_length(emoji) between 1 and 16),
  title       text not null check (char_length(btrim(title)) between 1 and 100),
  comment     text check (char_length(comment) <= 2000),
  date_start  date not null,
  date_end    date check (date_end is null or date_end >= date_start),
  created_by  uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create index pins_date_start_idx on public.pins (date_start desc);

-- ---------------------------------------------------------------------------
-- Audit columns are set by the server, never trusted from the client.
-- ---------------------------------------------------------------------------
create function public.pins_set_audit_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    new.updated_by := null;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_by := auth.uid();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger pins_set_audit_columns
before insert or update on public.pins
for each row execute function public.pins_set_audit_columns();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.pins     enable row level security;

revoke all on public.profiles from anon;
revoke all on public.pins     from anon;
grant select, insert, update         on public.profiles to authenticated;
grant select, insert, update, delete on public.pins     to authenticated;

-- profiles: everyone can read all names; each member writes only their own row.
create policy "members read profiles"
  on public.profiles for select to authenticated using (true);
create policy "members create own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "members update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- pins: fully collaborative between members.
create policy "members read pins"
  on public.pins for select to authenticated using (true);
create policy "members create pins"
  on public.pins for insert to authenticated with check (true);
create policy "members update pins"
  on public.pins for update to authenticated using (true) with check (true);
create policy "members delete pins"
  on public.pins for delete to authenticated using (true);

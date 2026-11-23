# World Memories: Specification (v1 draft)

A small shared web app showing an interactive 3D globe on which a small invited group
places pins (emoji, title, dates, comment) on places they've been.
Hosted on GitHub Pages, with Supabase handling auth and data.

---

## 1. Goals & non-goals

**Goals (v1)**
- Interactive 3D globe with map labels (countries, cities), zoomable, rotatable by left-click drag.
- Click a location to place a pin, then fill in emoji, title, date or date range, and comment, and save.
- Shared map: every logged-in member sees all pins and can edit or delete any pin.
- Invite-only login by magic link (email).
- Sidebar listing all pins with text search; clicking a pin flies the globe to it.
- Place-name lookup: reverse geocoding of the clicked point and a search box to fly to a place.
- Works on desktop and mobile; UI in French and English with a toggle.
- Static deployment to GitHub Pages through GitHub Actions.

**Non-goals (v1)**
- Photos or attachments.
- Date filter or timeline replay.
- Public (logged-out) view of pins.
- Open registration.
- Offline mode.
- Pin clustering (revisit if the pin count grows into the hundreds).

---

## 2. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Build | Vite + TypeScript | `base: '/world-memories/'` for GH Pages |
| UI | React 18+ | |
| Globe/map | MapLibre GL JS v6 (`projection: 'globe'`), used directly through a small React wrapper (`src/globe/Globe.tsx`) | Vector tiles with labels; zoom from globe level down to street level |
| Map tiles/style | OpenFreeMap (`liberty` style) | Free, no API key. Fallback: MapTiler free tier (needs a key) |
| Auth + DB | Supabase (Postgres, Auth, Row Level Security) | Free tier |
| Geocoding | Nominatim (OSM) or Photon (komoot) | Respect the usage policy: max 1 request/s, debounce search, no autocomplete-per-keystroke spam |
| Emoji picker | `frimousse` or `emoji-mart` | Lazy-loaded |
| i18n | `react-i18next` (or a small typed dictionary) | FR + EN, browser-language detection, choice persisted in `localStorage` |
| Routing | None, or hash routing | Avoids GH Pages 404 issues on deep links |
| Deploy | GitHub Actions → `actions/deploy-pages` | |

---

## 3. User stories

1. **Login.** As an invited member, I enter my email, receive a magic link, click it, and land on the globe logged in. Uninvited emails get no link.
2. **Explore.** I drag with the left mouse button (or one finger) to rotate the globe and scroll or pinch to zoom. Labels become more detailed as I zoom in.
3. **Add a pin.** I click a spot. A temporary marker appears and a form opens with the coordinates and an auto-filled place name. I choose an emoji, enter a title, a start date, an optional end date and a comment, then save. The pin appears for everyone.
4. **View a pin.** I click a pin and a popup or card shows its emoji, title, place, dates, comment, who created it and who last edited it.
5. **Edit or delete.** From the card, I can edit any field (including moving the pin by clicking a new location) or delete it after a confirmation.
6. **List & search.** A sidebar lists all pins, sorted by date (newest first). I type to filter by title, comment, place or author. Clicking an entry flies the globe to the pin and opens its card.
7. **Go to a place.** I type "Kyoto" in a search box and the globe flies there. I can then click to drop a pin.
8. **Language.** I switch between FR and EN at any time.

---

## 4. Functional requirements

### 4.1 Globe
- Initial view: whole globe, centered on the most recent pin (or lon 0 / lat 20 if there are none).
- Left-click drag rotates and wheel or pinch zooms. Right-click drag or Ctrl+drag tilts and rotates the bearing (MapLibre default; can be disabled).
- A **click** (not a drag) on the map starts pin creation. Drags must never create pins; MapLibre's `click` event already ignores drags.
- Pins are rendered as emoji markers. Markers on the far side of the globe must be hidden.
- Optional atmosphere and space background (MapLibre `sky` / `fog` settings).
- Nice-to-have: a slow idle auto-rotation that stops as soon as the user interacts.

### 4.2 Pin form
| Field | Type | Rules |
|---|---|---|
| Location | lat/lng | Set by the click; shown read-only (e.g. `48.8566° N, 2.3522° E`); "move" button to re-pick |
| Place name | text | Auto-filled through reverse geocoding (e.g. "Paris, France"); editable; may be empty if the lookup fails |
| Emoji | single emoji | Required; default 📍 |
| Title | text | Required, max 100 characters |
| Start date | date | Required |
| End date | date | Optional; must be ≥ start date |
| Comment | multiline text | Optional, max 2000 characters; plain text, line breaks kept |

- Save and Cancel buttons. Esc cancels. Unsaved changes trigger a confirmation before closing.
- Desktop: the form opens as a side panel. Mobile: it opens as a bottom sheet.

### 4.3 Pin display
- Card shows the emoji, title, place name, date or range (localized, e.g. "12–18 mars 2024" / "Mar 12–18, 2024"), comment, "added by X · edited by Y, date".
- Actions: Edit, Delete (with confirmation), Fly to.

### 4.4 Sidebar
- Collapsible on desktop and a drawer on mobile.
- Search input filters on the client side (title, comment, place name, author display name), ignoring case and accents.
- Each entry shows emoji, title, place, date. Clicking it flies to the pin and opens its card.
- Shows the pin count.

### 4.5 Place search
- A search box (separate from the pin-list search, or a mode of it) queries forward geocoding with a debounce of 500 ms or more, shows up to 5 results, and flies to the selected one.

### 4.6 Auth
- Login screen shown over a slowly rotating globe with no pins.
- Magic link through `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: <site URL> } })`.
- In Supabase: **disable sign-ups**. Members are invited from the Supabase dashboard (Auth → Invite user).
- On first login, the member sets a **display name** (stored in `profiles`).
- Logout button in the header.
- Session persists across reloads (Supabase default).

### 4.7 Sync
- Load all pins after login. v1 assumes a few hundred pins at most, so they are fetched in one query.
- **Nice-to-have:** Supabase Realtime subscription on `pins` so other members' changes appear live.
- Conflicts: the last write wins, and `updated_by` and `updated_at` are shown.

### 4.8 i18n
- FR and EN for all UI strings. Dates are formatted with `Intl.DateTimeFormat` in the active locale.
- Default language comes from `navigator.language`, with `fr` if it starts with "fr" and `en` otherwise. The user's choice is stored in `localStorage`.
- Pin content (titles, comments) is user text and is not translated.

---

## 5. Data model (Supabase / Postgres)

```sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  created_at   timestamptz not null default now()
);

create table public.pins (
  id          uuid primary key default gen_random_uuid(),
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  place_name  text,
  emoji       text not null default '📍',
  title       text not null check (char_length(title) between 1 and 100),
  comment     text check (char_length(comment) <= 2000),
  date_start  date not null,
  date_end    date check (date_end is null or date_end >= date_start),
  created_by  uuid not null references auth.users(id) default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now()
);

-- trigger: on update set updated_at = now(), updated_by = auth.uid()
```

### Row Level Security
Sign-ups are disabled, so being **authenticated means being an invited member**.

- `pins`: enable RLS; the `authenticated` role gets `select`, `insert`, `update`, `delete` with `using (true)` / `with check (true)`.
- `profiles`: `authenticated` can `select` all rows; `insert`/`update` only where `id = auth.uid()`.
- `anon` role gets no access to either table.

The Supabase URL and anon key are public by design and ship in the frontend bundle. Security relies entirely on RLS and on sign-ups being disabled.

---

## 6. Deployment

- Repo: `world-memories` on GitHub. Pages source: GitHub Actions.
- Workflow: on push to `main`, run `npm ci`, `npm run build` and deploy `dist/`.
- Build-time env vars (repo **Variables**, not secrets, since they are public anyway): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Supabase Auth settings:
  - Site URL: `https://<user>.github.io/world-memories/`
  - Redirect URLs: the same, plus `http://localhost:5173/world-memories/` for development.
  - Sign-ups disabled.
  - Supabase's built-in email is heavily rate-limited (a few emails per hour), which is fine for the intended usage.
- Supabase migrations live in `supabase/migrations/*.sql` so the schema can be recreated.

**Free-tier caveat:** A weekly GitHub Action can send it a ping to prevent the pause.

---

## 7. Proposed project structure

```
world-memories/
├─ SPEC.md
├─ README.md
├─ index.html
├─ vite.config.ts
├─ .env.example                # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├─ .github/workflows/deploy.yml
├─ supabase/migrations/0001_init.sql
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ lib/supabase.ts
   ├─ lib/geocoding.ts
   ├─ i18n/{index.ts, en.json, fr.json}
   ├─ auth/{LoginScreen.tsx, ProfileSetup.tsx, useSession.ts}
   ├─ globe/{Globe.tsx, PinMarker.tsx}
   ├─ pins/{usePins.ts, PinForm.tsx, PinCard.tsx, types.ts}
   └─ sidebar/{Sidebar.tsx, PlaceSearch.tsx}
```

---

## 8. Milestones

1. **Scaffold:** Vite + React + TS, MapLibre globe with OpenFreeMap tiles, deployed to GH Pages (no auth yet).
2. **Supabase:** schema, RLS, magic-link login, profile setup.
3. **Pins CRUD:** click to create, form, markers, card, edit and delete.
4. **Sidebar & search:** pin list, filter, fly-to; place search; reverse geocoding.
5. **i18n & mobile polish:** FR/EN, bottom sheets, touch testing.
6. **Nice-to-haves:** realtime sync, idle auto-rotation, keep-alive ping.

---

## 9. Open questions

- Should the map style follow the system's dark or light mode, or stay fixed?
- Should a pin show a hover tooltip with its title on desktop, or only open on click?
- Is an export or backup of all pins wanted (JSON/GeoJSON download)?
- Should a custom domain be used instead of `<user>.github.io/world-memories`?

# World Memories 🌍

A shared 3D globe where a small invited group pins the places they've been.
See [SPEC.md](SPEC.md) for the full specification and milestones.

## Development

```sh
npm install
npm run dev       # http://localhost:5173/world-memories/
npm run build     # type-check + production build into dist/
npm run preview   # serve dist/ at http://localhost:4173/world-memories/
npm run lint
```

Copy `.env.example` to `.env` and fill in the Supabase project URL and publishable key
(Supabase dashboard → Project Settings → API Keys).

## Supabase setup (one time)

1. **Schema:** SQL Editor → New query → paste `supabase/migrations/0001_init.sql` → Run.
2. **Disable sign-ups:** Authentication → Sign In / Providers → turn off
   *Allow new users to sign up*. Keep the *Email* provider enabled.
3. **Redirect URLs:** Authentication → URL Configuration
   - Site URL: `https://<user>.github.io/world-memories/`
   - Redirect URLs: `https://<user>.github.io/world-memories/`,
     `http://localhost:5173/world-memories/`, `http://localhost:4173/world-memories/`
4. **Invite members:** Authentication → Users → Add user → *Send invitation*.
   The invitation link logs them in and asks them to choose a display name.
   Afterwards they log in from the site with a magic link.

Supabase's built-in email sender allows only a few emails per hour, which is enough for a
small group.

## Deployment (GitHub Pages)

1. Create a GitHub repository named **`world-memories`** and push to `main`.
   If you use another name, update `base` in `vite.config.ts` to match.
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Add the repository **Variables** `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` (Settings → Secrets and variables → Actions → Variables).

Every push to `main` builds and deploys through `.github/workflows/deploy.yml`.
The site is then served at `https://<user>.github.io/world-memories/`.

## Notes

- Map tiles and style: [OpenFreeMap](https://openfreemap.org) (`liberty` style), no API key.
- MapLibre GL v6 is used directly (no React wrapper). Its web worker is shipped as a Vite
  asset and registered with `setWorkerUrl` in `src/globe/Globe.tsx`; without that, the
  bundled app fails with "Worker failed to load".

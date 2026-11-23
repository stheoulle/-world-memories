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

From milestone 2 on, copy `.env.example` to `.env` and fill in the Supabase values.

## Deployment (GitHub Pages)

1. Create a GitHub repository named **`world-memories`** and push to `main`.
   If you use another name, update `base` in `vite.config.ts` to match.
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. From milestone 2 on, add the repository **Variables** `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (Settings → Secrets and variables → Actions → Variables).

Every push to `main` builds and deploys through `.github/workflows/deploy.yml`.
The site is then served at `https://<user>.github.io/world-memories/`.

## Notes

- Map tiles and style: [OpenFreeMap](https://openfreemap.org) (`liberty` style), no API key.
- MapLibre GL v6 is used directly (no React wrapper). Its web worker is shipped as a Vite
  asset and registered with `setWorkerUrl` in `src/globe/Globe.tsx`; without that, the
  bundled app fails with "Worker failed to load".

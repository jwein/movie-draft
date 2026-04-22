# Movie Draft

Movie Draft is a small React app for running a shared movie draft with a searchable board, category-specific eligibility rules, and optional Firebase session sync.

## Repository layout

- `movie-draft-app/`: the application source, scripts, tests, and build configuration
- `.github/workflows/`: GitHub Pages deployment workflow

## Quick start

```bash
cd movie-draft-app
npm install
npm run dev
```

Open `http://localhost:5173` for local development.

## Environment variables

Create `movie-draft-app/.env` from `movie-draft-app/.env.example` when you want to enable optional integrations.

- `TMDB_API_KEY`: used by the maintenance scripts that enrich movie metadata
- `VITE_FIREBASE_*`: used for multiplayer session sync

## Privacy note

The repository ships with synthetic member names, picker assignments, and vote history so the app can be shared publicly without exposing the original private group data.

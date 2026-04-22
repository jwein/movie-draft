# Movie Draft App

React + Vite app for running a six-person snake-style movie draft with searchable picks, category rules, and optional Firebase-backed session sync.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build and test

```bash
npm run build
npm run test
npm run lint
```

## Environment

Copy `.env.example` to `.env` when you want local secrets or optional integrations.

- `TMDB_API_KEY` supports poster and metadata maintenance scripts.
- `VITE_FIREBASE_*` values enable shared session mode.

The checked-in movie and vote fixtures are synthetic and intended for demos and development only.

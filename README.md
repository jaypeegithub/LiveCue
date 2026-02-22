# LiveCue MVP

Minimal deployable app: visits ESPN MMA and returns whether the site exists.

- **GET /api/espn** — Returns `{ "exists": true }` or `{ "exists": false }` (HEAD request to https://www.espn.com/mma/)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Hit http://localhost:3000/api/espn for the check.

## Deploy on Vercel

Push to GitHub, then import the repo at [vercel.com](https://vercel.com). No env vars required.

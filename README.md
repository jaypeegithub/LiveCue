# LiveCue MVP

- **GET /api/espn** — Returns `{ "exists": true }` if ESPN MMA is up.
- **GET /api/espn/event?eventId=600057329** — Main card fights (from Supabase if synced, else ESPN).
- **POST /api/espn/sync** — Sync Strickland vs Hernandez main card from ESPN into Supabase.

## Run locally

```bash
npm install
cp .env.example .env.local   # add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

## Supabase (event + fights DB)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `supabase/migrations/002_events_fights.sql`.
3. In **Settings → API**, copy **Project URL** and **service_role** key into `.env.local`.
4. Sync the main card once: `curl -X POST http://localhost:3000/api/espn/sync`
5. Open [/event](http://localhost:3000/event) — data is read from the database.

**Tables:** `events` (espn_event_id, name, event_date), `fights` (event_id, weight_class, fighter1/2 names and records, status, order_index).

## Deploy on Vercel

Import the repo, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then after deploy run `POST https://your-app.vercel.app/api/espn/sync` once to populate the DB.

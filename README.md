# LiveCue MVP

- **GET /api/espn/events** — Next 3 UFC events (from Supabase if synced, else ESPN).
- **GET /api/espn/event?eventId=...** — Main card fights for an event (from Supabase if synced, else ESPN).
- **POST /api/espn/sync** — Sync next 3 events and their main cards from ESPN into Supabase.

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
4. Sync once: `curl -X POST http://localhost:3000/api/espn/sync` — then the home page dropdowns use the database.

**Tables:** `events` (espn_event_id, name, event_date), `fights` (event_id, weight_class, fighter1/2 names and records, status, order_index).

## Deploy on Vercel

Import the repo, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then after deploy run `POST https://your-app.vercel.app/api/espn/sync` once to populate the DB.

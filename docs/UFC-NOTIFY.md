# LiveCue – UFC Fight Notify

Get a **text when the fight before your chosen fight ends**, so you know your fight is next.

## Stack

- **Next.js** (App Router) – frontend + API routes
- **ESPN API** – `site.api.espn.com` scoreboard (no scraping)
- **Supabase** – events, fights, subscriptions
- **Twilio** – SMS
- **Vercel** – host + cron (every 1 minute)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration: **SQL Editor** → paste and run `supabase/migrations/001_ufc_notify.sql`.
3. In **Settings → API**: copy **Project URL** and **service_role** key (keep secret).

### 2. Twilio

1. Sign up at [twilio.com](https://twilio.com), get a phone number.
2. Copy **Account SID**, **Auth Token**, and your **Twilio phone number**.

### 3. Env vars

Copy `.env.example` to `.env.local` and set:

- `SUPABASE_URL` – Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key  
- `TWILIO_ACCOUNT_SID`  
- `TWILIO_AUTH_TOKEN`  
- `TWILIO_PHONE_NUMBER` – e.g. `+15551234567`  
- `CRON_SECRET` (optional) – random string; if set, cron must send `Authorization: Bearer <CRON_SECRET>`.

### 4. Vercel (production)

1. Deploy the app to Vercel.
2. Add the same env vars in **Project → Settings → Environment Variables**.
3. Cron is defined in `vercel.json` and runs **every minute** (`* * * * *`).
4. If you use `CRON_SECRET`, in **Project → Settings → Cron** add a header:  
   `Authorization: Bearer <your CRON_SECRET>`.

## Testing sync every 10 seconds (MVP)

Vercel Cron only supports a 1‑minute minimum. To test more often locally:

```bash
# Terminal 1: run the app
npm run dev

# Terminal 2: call sync every 10 seconds (optional: set CRON_SECRET and use -H "Authorization: Bearer $CRON_SECRET")
while true; do curl -s -X POST http://localhost:3000/api/ufc/sync | jq .; sleep 10; done
```

## Flow

1. **Cron** calls `POST /api/ufc/sync` every minute (or you trigger it manually).
2. **Sync** fetches today’s UFC scoreboard from ESPN, upserts `ufc_events` and `ufc_fights` in Supabase.
3. For each fight that is **complete**, sync finds the **next** fight and any **subscriptions** for that next fight (where `notified_at` is null).
4. Sends an SMS via Twilio: *“LiveCue: The fight before yours just ended. [Fighter A] vs [Fighter B] is up next!”* and sets `notified_at` for that subscription.
5. **Frontend** at `/ufc`: user picks a fight and enters a phone number; `POST /api/ufc/subscribe` stores the subscription. They get one text when the **previous** fight finishes.

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ufc/scoreboard` | GET | Optional `?date=YYYY-MM-DD`. Fetches ESPN, syncs to DB, returns event + fights (with DB ids). |
| `/api/ufc/sync` | POST | Cron: fetch ESPN, upsert DB, send SMS for “fight just before” subscribers. |
| `/api/ufc/subscribe` | POST | Body: `{ "fight_id": "uuid", "phone": "5551234567" }`. Subscribe to get a text when the fight *before* this one ends. |

## Data source

UFC data comes from the public **ESPN API** (no scraping):

- `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=YYYYMMDD`

Fight status is derived from `status.type.state`: `post` / `completed` → **complete**, `in` → **in_progress**, else **not_started**.

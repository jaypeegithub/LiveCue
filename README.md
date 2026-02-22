# LiveCue

Get a text when your UFC fight is about to start — we notify you when the fight *before* your pick ends so you know yours is next.

## Stack

Next.js 14, Supabase, Twilio, Vercel (cron). Data from ESPN API.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in Supabase + Twilio keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **UFC — Today's card** to see the fight list and subscribe.

## Setup

See [docs/UFC-NOTIFY.md](docs/UFC-NOTIFY.md) for Supabase migration, Twilio, env vars, and Vercel cron.

## Deploy on Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com) (New Project → Import Git Repository).
2. Add environment variables in **Project → Settings → Environment Variables**:  
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`. Optionally add `CRON_SECRET` and set the same value in **Settings → Cron** as header: `Authorization: Bearer <CRON_SECRET>`.
3. Deploy. The cron in `vercel.json` will run `/api/ufc/sync` every minute.

### Compliance URLs (e.g. Twilio / Vercel forms)

After deployment, use these **direct links** when asked for policy URLs (replace `YOUR_DOMAIN` with your Vercel URL, e.g. `livecue.vercel.app`):

- **Privacy Policy:** `https://YOUR_DOMAIN/privacy`  
  Details what data we collect, how it’s used, and states that we do not share with third parties or use for marketing.

- **Terms and Conditions:** `https://YOUR_DOMAIN/terms`  
  Includes program name (LiveCue), description, message/data rates, message frequency, support contact, and opt-out instructions (**HELP** and **STOP** in bold).

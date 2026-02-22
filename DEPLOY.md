# Deploy LiveCue to GitHub and Vercel

Your repo has one commit and is ready to push. Follow these steps.

---

## 1. Push to GitHub

### Option A: Create repo on GitHub first (recommended)

1. Go to [github.com/new](https://github.com/new).
2. Repository name: **LiveCue** (or any name).
3. Leave it empty (no README, no .gitignore).
4. Create the repository.
5. In your terminal, from the project folder run (replace `YOUR_USERNAME` with your GitHub username):

```bash
cd /Users/jgoat/Desktop/GITHUB/LiveCue
git remote add origin https://github.com/YOUR_USERNAME/LiveCue.git
git branch -M main
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/LiveCue.git
git branch -M main
git push -u origin main
```

### Option B: If you use GitHub CLI

```bash
cd /Users/jgoat/Desktop/GITHUB/LiveCue
gh repo create LiveCue --private --source=. --remote=origin --push
```

---

## 2. Deploy to Vercel

### Option A: From Vercel dashboard (easiest)

1. Go to [vercel.com](https://vercel.com) and sign in (use “Continue with GitHub” if you pushed to GitHub).
2. Click **Add New…** → **Project**.
3. Import the **LiveCue** repository.
4. Leave **Root Directory** as `.` and **Framework** as Next.js.
5. Add **Environment Variables** (Settings → Environment Variables or during import):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - (Optional) `CRON_SECRET`
6. Click **Deploy**. Vercel will build and deploy. The cron in `vercel.json` will run `/api/ufc/sync` every minute.

### Option B: From terminal with Vercel CLI

```bash
cd /Users/jgoat/Desktop/GITHUB/LiveCue
npx vercel
```

Log in if prompted, then follow the prompts. To add env vars from the CLI, use:

```bash
npx vercel env add SUPABASE_URL
npx vercel env add TWILIO_PHONE_NUMBER
# … etc.
```

---

## After deploy

- **App:** `https://YOUR_PROJECT.vercel.app`
- **Privacy Policy:** `https://YOUR_PROJECT.vercel.app/privacy`
- **Terms:** `https://YOUR_PROJECT.vercel.app/terms`

Use those two URLs when a form asks for Privacy Policy and Terms and Conditions links.

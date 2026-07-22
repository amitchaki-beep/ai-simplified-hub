# AI Simplified Learning Hub

A mobile-first learning platform for the "AI Simplified – Zero to Hero" course:
8 levels, 79 lessons with activities, 80-question quiz bank, a resource
library, a prompt library, an AI Coach, and student registration with
email OTP verification (backed by a Google Sheet).

This is a real, standalone website — not a Claude artifact — so it can
connect to your Google Apps Script backend and send real emails.

---

## 1. Deploy to Vercel (free)

You need [Node.js](https://nodejs.org) installed on your computer, and a
free [Vercel](https://vercel.com) account.

**Option A — Vercel CLI (fastest):**

```bash
cd ai-simplified-hub
npm install
npx vercel
```

Follow the prompts (log in, confirm project name, accept defaults). Vercel
gives you a live URL immediately. Run `npx vercel --prod` to publish it as
your permanent production URL.

**Option B — GitHub + Vercel dashboard (no command line):**

1. Create a new repository on [github.com](https://github.com) and upload
   this whole folder to it (drag-and-drop works on github.com).
2. Go to [vercel.com/new](https://vercel.com/new), click "Import" next to
   your new repository.
3. Vercel auto-detects Vite — just click **Deploy**.

---

## 2. Add your Anthropic API key (for the AI Coach)

The AI Coach calls `/api/coach`, a serverless function that keeps your
API key private on the server — it's never exposed to students' browsers.

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In your Vercel project: **Settings → Environment Variables**
3. Add a variable named `ANTHROPIC_API_KEY` with your key as the value
4. Redeploy (Vercel does this automatically after saving env vars, or run
   `npx vercel --prod` again)

If you skip this step, the rest of the app still works fine — only the
AI Coach tab will show a "not configured" message.

---

## 3. Registration backend (already connected)

The registration/login/OTP flow is already wired to your Google Apps
Script Web App URL inside `src/App.jsx` (search for `APPS_SCRIPT_URL`).
Nothing else to do here — this will now work correctly, since a real
website (unlike a Claude artifact) isn't restricted to a small CDN
allowlist for outgoing network requests.

If you ever redeploy your Apps Script and get a new URL, update
`APPS_SCRIPT_URL` in `src/App.jsx` and redeploy the site.

---

## 4. Local development (optional)

To preview changes on your own computer before deploying:

```bash
npm install
npm run dev
```

Then open the local address it prints (usually `http://localhost:5173`).
Note: `/api/coach` won't work with plain `npm run dev` — that only runs
with Vercel's own dev server: `npx vercel dev` instead.

---

## Project structure

```
ai-simplified-hub/
├── api/
│   └── coach.js          # Serverless proxy for the AI Coach (keeps API key private)
├── src/
│   ├── App.jsx            # The whole application
│   ├── main.jsx            # Entry point
│   └── storageShim.js       # Makes student progress persist via localStorage
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## Custom domain

Once deployed, Vercel gives you a free `your-project.vercel.app` URL.
To use your own domain (e.g. `learn.digiglobaltechnology.com`), go to
**Project → Settings → Domains** in Vercel and follow the prompts —
you'll need access to your domain's DNS settings.

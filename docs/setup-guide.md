# CentraMind Blueprint -- Setup Guide

This guide walks you from a fresh clone to a running CentraMind dashboard with a working Chat tab. Plan on 15-20 minutes for the first run.

You can either follow these steps yourself, or paste this whole document into a fresh Claude Code session and ask it to do the setup for you. Both paths land in the same place.

---

## What you need

1. **Node.js 18 or newer** -- `node --version` should show v18+. Get it from [nodejs.org](https://nodejs.org/) if you're missing it.
2. **A code editor** -- VS Code, Cursor, or anything else. Optional but recommended.
3. **Claude Code installed** -- `claude --version` should work in your terminal. Install from [docs.anthropic.com/claude-code](https://docs.anthropic.com/en/docs/claude-code).
4. **An Eternium account + API key** -- this powers the Chat tab. If you bought this template through Eternium, the key arrived in your welcome email. Otherwise sign up at [eternium.ai/centramind](https://eternium.ai/centramind).
5. **A Supabase project** (optional, only if you want persistent lead capture) -- free tier is fine. Sign up at [supabase.com](https://supabase.com/).

---

## Step 1 -- Clone and install

```bash
git clone <your-private-repo-url-here> centramind
cd centramind
npm install
```

The install pulls about 260 packages and finishes in 10-20 seconds. No private registries, no warnings.

---

## Step 2 -- Configure your environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor. The minimum to make the dashboard run is leaving everything blank -- it'll work without Supabase or Eternium. To make the Chat tab work, fill in `ETERNIUM_API_KEY` (the `eai_` token from your welcome email). To make lead capture work, fill in the two `VITE_SUPABASE_*` variables.

**Important:** `ETERNIUM_API_KEY` is a server-side variable (no `VITE_` prefix). The Pages Function at `api/chat.js` reads it on the server. Never expose it to the browser.

---

## Step 3 -- Boot the dashboard

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`). The first time you visit, you'll see the Landing onboarding -- a 5-step questionnaire that asks about your business, the systems you run, and the team you want CentraMind to model. Take 3-5 minutes to fill it out honestly. The answers seed your dashboard.

When you click "Generate Blueprint," your answers compile into `localStorage` and the dashboard appears.

To revisit onboarding later: `http://localhost:5173/?onboard=1`.

---

## Step 4 -- Connect Claude Code

In the same project directory, run:

```bash
claude
```

Claude Code reads `CLAUDE.md` automatically and now has the full context of your CentraMind. Try:

```
> /standup
```

You should get a morning briefing pulled from `TODO.md`, `HEARTBEAT.md`, and `state/session-log.json`. The first run has thin output because you haven't logged any sessions yet. After a few `/handoff` runs, this becomes a serious daily ritual.

---

## Step 5 -- Try the Chat tab

Click the **Chat** tab in the dashboard. Type a question:

> What should I focus on today?

The Chat tab calls `/api/chat`, which is the Pages Function at `api/chat.js`. It builds a system prompt from your current `OWNER.md`, your top priorities in `TODO.md`, your active projects in `state/project.json`, and any recent session entries -- then asks the Eternium API (which routes to a top-tier model) on your behalf. The cost deducts from your credit balance at $0.005 per credit. A typical answer is a fraction of a cent.

If you see **402 Payment Required**, your balance is empty. Hit [eternium.ai/credits/topup](https://eternium.ai/credits/topup) to add credits, then retry.

---

## Step 6 (optional) -- Hook up Supabase

If you want to persist email leads or be ready for future versions that wire CRM / Sessions to Postgres:

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard/).
2. Settings -> API -> copy the Project URL and anon key into `.env.local`.
3. SQL Editor -> paste and run, in order:
   - `supabase/migrations/001_core_schema.sql`
   - `supabase/migrations/002_blueprint_leads.sql`
   - `supabase/migrations/003_crm_tasks.sql`
4. Restart `npm run dev`.

The migrations are idempotent -- re-running them is safe. They ship with **open Row-Level Security policies** suitable for a single-user dashboard. If you ever deploy this with shared access (multiple team members, public-facing) tighten the RLS policies to require auth first.

---

## Step 7 (optional) -- Rebrand

Open `theme.config.js`. Edit the `brandName`, `colors`, `typography`, and `links` blocks. Then:

```bash
npm run theme
```

That regenerates `src/theme.generated.css`. Refresh your browser and the dashboard wears your brand.

You can also point the PDF docs generator at your own logos by updating the `logos` block in `theme.config.js`. Then `npm run docs` produces `docs/CentraMind-Blueprint-Docs.pdf` with your branding.

---

## Step 8 -- Deploy (when you're ready)

This template ships with Cloudflare Pages in mind because of the `api/chat.js` Pages Function. To deploy:

1. Push your local repo to a private GitHub repo of your own.
2. Connect that repo to a new Cloudflare Pages project.
3. Build command: `npm run build`. Build output: `dist`.
4. Environment variables (under Pages Settings): set `ETERNIUM_API_KEY` (and any `VITE_SUPABASE_*` you use). Mark `ETERNIUM_API_KEY` as encrypted; do not check "expose to browser."
5. Deploy. Your dashboard lives at `https://<project>.pages.dev`. Set a custom domain in Cloudflare Pages if you want a clean URL.

Other Node-friendly hosts (Vercel, Netlify) work too, but you'll need to port `api/chat.js` to that host's function format. The logic is small and well-commented.

---

## Daily ritual

The pattern most users settle into:

- **Morning** -- `claude`, `/standup`. Then plan the day with the Chat tab.
- **Working** -- the dashboard sits open in a tab. You glance at Priorities and CRM during the day. Claude Code is the side-car you ask questions of as you work.
- **End of day** -- `claude`, `/handoff`. The skill captures what you did, what's pending, what's blocked. It updates `memory/MEMORY.md` and appends to `state/session-log.json`. Tomorrow's `/standup` will reflect today.

That's the whole product. Everything else (Skills, Fleet, Processes, Memory browser) is supporting your daily ritual.

---

## Troubleshooting

**`npm run dev` errors with "theme.config.js not found":** make sure you're in the repo root when you run npm scripts. The `predev` hook expects `theme.config.js` at root.

**Chat tab returns 401:** your `ETERNIUM_API_KEY` is missing or invalid. Check `.env.local`. Restart `npm run dev` after edits.

**Chat tab returns 402:** balance depleted. Top up at [eternium.ai/credits/topup](https://eternium.ai/credits/topup).

**Claude Code says "I don't see any context":** run `claude` from the repo root. Claude Code only reads `CLAUDE.md` from its working directory.

**Dashboard tabs show empty state:** that's normal on a fresh install. Run `/handoff` a few times via Claude Code to populate state. Or click "Run the bootstrap prompt" links inside the dashboard for guidance.

**`npm run build` fails with em-dash error:** somewhere in your edits you typed an em-dash (`---`). The build refuses them by policy. Use hyphens or " - " spaced.

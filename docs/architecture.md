# CentraMind Blueprint -- Architecture Reference

This is the source-of-truth doc for understanding the CentraMind template. It mirrors what the code actually does (last verified against `main` on 2026-05-15). The diagrams in marketing copy may simplify; this doc is honest.

---

## What it is

A React + Vite SPA that gives a non-technical or semi-technical owner a structured operating dashboard for their AI-assisted business. The user runs a one-time onboarding (Blueprint questionnaire), the answers seed the dashboard's state, and from there the dashboard is the user's daily command center.

The dashboard talks to two backends:

1. **Eternium API** (`api.eternium.ai`) -- powers the Chat tab via the `functions/api/chat.js` Cloudflare Pages Function. The owner's prepaid credit balance funds chat. They never juggle OpenAI / Anthropic keys.
2. **Supabase** (optional) -- if the owner provides `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, the onboarding form persists email leads and the migrations create tables for future CRM / session-log / projects sync. The dashboard works without Supabase; disk-based JSON state is the default.

The third "backend" is **Claude Code itself**. The owner runs `claude` locally in the project directory. The skills under `.claude/skills/` (`standup`, `handoff`) give Claude Code structured access to the same state files the dashboard reads. The dashboard renders state; Claude Code mutates state.

---

## File map (current code)

```
armory-centramind-blueprint/
├── CLAUDE.md                  # Boot config for Claude Code in this dir
├── OWNER.md                   # Owner profile (template, edit on first run)
├── TODO.md                    # Current priorities (free-form markdown)
├── HEARTBEAT.md               # Active alerts / current-session state
├── theme.config.js            # Brand colors + fonts + links (regenerates CSS)
├── .env.example               # Supabase + Eternium key placeholders
│
├── api/
│   └── chat.js                # Cloudflare Pages Function for the Chat tab
│                              # (proxies to api.eternium.ai, reads
│                              # ETERNIUM_API_KEY server-side)
│
├── src/
│   ├── main.jsx               # App entry
│   ├── App.jsx                # Top-level routing (onboarding vs dashboard)
│   ├── index.css              # Imports tailwind + theme.generated.css
│   │
│   ├── components/
│   │   ├── blueprint/         # Onboarding questionnaire (8 components)
│   │   │   ├── Landing.jsx
│   │   │   ├── StepNav.jsx
│   │   │   ├── EterniumAccount.jsx
│   │   │   ├── CentraMindSystems.jsx
│   │   │   ├── CentraMindTeam.jsx
│   │   │   ├── ProcessAudit.jsx
│   │   │   ├── ChecklistGroup.jsx
│   │   │   ├── SystemArchitecture.jsx
│   │   │   └── BlueprintSummary.jsx
│   │   │
│   │   └── dashboard/
│   │       ├── CentraMindDashboard.jsx  # The 12-tab command center
│   │       └── ChatTab.jsx              # Chat tab UI (SSE streaming, history, balance)
│   │
│   ├── lib/
│   │   ├── supabase.js           # Optional Supabase client (lead capture)
│   │   ├── blueprint-export.js   # Generates the bootstrap prompt
│   │   ├── chat-context.js       # Builds system prompt for Chat tab
│   │   └── centramind-catalog.js # Default agent / skill / process catalog
│   │
│   ├── hooks/
│   │   └── useSupabase.js        # Realtime data hooks (optional, reserved)
│   │
│   └── theme.generated.css       # AUTO-GENERATED from theme.config.js
│
├── state/                        # JSON state mirrors -- source of truth
│   ├── project.json              # Onboarding output (the workspace blueprint)
│   ├── session-log.json          # Appended by /handoff skill
│   ├── crm.json                  # CRM pipelines (read by CRM tab)
│   └── skills.json               # Active skills the user selected
│
├── context/                      # Project briefs (free-form markdown)
│   └── product-brief.md
│
├── memory/                       # Persistent AI memory
│   └── MEMORY.md
│
├── .claude/
│   └── skills/                   # Claude Code skill files
│       ├── standup.md            # Morning briefing
│       └── handoff.md            # End-of-session state sync
│
├── supabase/
│   └── migrations/
│       ├── 001_core_schema.sql   # projects, session_logs, directives, alerts
│       ├── 002_blueprint_leads.sql
│       └── 003_crm_tasks.sql     # contacts, deals, tasks
│
├── scripts/
│   ├── build-theme.cjs           # Regenerates src/theme.generated.css
│   ├── check-no-em-dashes.cjs    # Enforces no-em-dash rule in commits
│   └── build-pdf.cjs             # Generates docs/CentraMind-Blueprint-Docs.pdf
│
└── docs/
    ├── architecture.md           # This file
    └── setup-guide.md            # Buyer-facing setup walkthrough
```

---

## Data flow

```
First run:
  User loads /                      -> sees Landing onboarding
  Fills 5-step questionnaire        -> answers stored in localStorage
  Clicks "Generate Blueprint"       -> Blueprint summary renders
  Optionally pastes email           -> POST to Supabase blueprint_leads
  Clicks "Open Dashboard"           -> stores blueprint, redirects to dashboard

Subsequent runs:
  User loads /                      -> blueprint present in localStorage
                                       OR state/project.json exists on disk
                                    -> auto-routes to dashboard
                                    -> User can revisit onboarding at /?onboard=1

Daily use:
  User opens dashboard              -> each tab reads from disk state
                                       (via Vite import.meta.glob) + the
                                       blueprint in localStorage
  User opens Chat tab               -> POSTs to /api/chat with the message
                                       + system prompt built from state +
                                       OWNER.md + TODO.md + project.json
  Pages Function functions/api/chat.js        -> reads ETERNIUM_API_KEY from env
                                    -> POSTs to api.eternium.ai/v1/reseller/
                                       chat/completions with Bearer eai_
                                    -> streams response back via SSE
  User asks Claude Code locally     -> $ claude
                                    -> Claude Code reads CLAUDE.md +
                                       state/* + memory/MEMORY.md
                                    -> User says "/handoff" -> Claude Code
                                       runs the skill, appends to
                                       state/session-log.json + updates
                                       memory/MEMORY.md
                                    -> Dashboard auto-refreshes on file change
                                       (Vite HMR)
```

---

## Why Supabase is optional

The dashboard is designed to work offline-first on disk JSON. Supabase exists as an upgrade path for owners who want:

- Persistent lead capture (if the buyer is using their CentraMind to capture leads)
- Cross-device session-log sync (if the buyer works from multiple machines)
- Realtime updates between the dashboard and external integrations

For v1, the disk-first design means a buyer can clone, install, and run with zero external services. The migrations under `supabase/migrations/` are there for the day they decide to wire it up.

---

## Why the Chat tab needs a server-side proxy

Eternium API keys (`eai_<32 chars>`) are bearer tokens. If the dashboard called `api.eternium.ai` directly from the browser, the token would be visible in DevTools to anyone who opens the page. That is unsafe for any dashboard hosted publicly (Cloudflare Pages, Vercel, your own subdomain).

`functions/api/chat.js` is a Cloudflare Pages Function that runs server-side. It reads `ETERNIUM_API_KEY` from the deployment's env (never exposed to the client), proxies the chat request to Eternium, and streams the response back to the browser. The browser never sees the key.

For local development, the Vite dev server proxies `/api/*` to a local Pages Function emulator (or you set `ETERNIUM_API_KEY` in `.env.local` and the proxy uses it). See `docs/setup-guide.md` for details.

---

## The 4 layers (the conceptual model)

CentraMind organizes everything into four layers. These map to specific files / tabs in this codebase:

1. **Central Intelligence** -- the documents that give the AI full business context.
   Files: `CLAUDE.md`, `OWNER.md`, `context/product-brief.md`, `state/project.json`
   Tab: Settings (read), Overview (read)
2. **Contextual Memory** -- persistent knowledge across sessions.
   Files: `memory/MEMORY.md`, `state/session-log.json`
   Tabs: Memory, Sessions
3. **Autonomous Agents** -- the skills + roster that let the AI execute work.
   Files: `.claude/skills/*.md`, `state/skills.json`, `state/roster.json`
   Tabs: Skills, Executives, Fleet, Processes
4. **Human Override** -- the alerts + priorities that keep the human in control.
   Files: `TODO.md`, `HEARTBEAT.md`, `state/crm.json`
   Tabs: Priorities, CRM

The Dashboard is the visualization of all four. Claude Code is the working partner on all four. The Chat tab is the conversational interface on all four.

---

## Common task recipes

**Add a new project to the dashboard:**
1. Open the Overview tab, click "Add project" (or)
2. Edit `state/project.json` and append to `projects[]` (or)
3. Use Claude Code: `claude` -> `add a project called "Helix" for me`. Claude reads `state/project.json`, appends, writes back.

**Add a new skill:**
1. Drop a markdown file in `.claude/skills/<name>.md` describing what the skill does.
2. Restart Claude Code to pick up the new skill.
3. Optionally add it to `state/skills.json` so the Skills tab lists it.

**Persist a key fact to memory:**
1. Tell Claude Code: `/handoff and remember that <fact>`. The skill appends to `memory/MEMORY.md`.
2. Or edit `memory/MEMORY.md` directly.

**Rebrand:**
1. Edit `theme.config.js`.
2. Run `npm run theme` (or just `npm run dev` -- predev regenerates).
3. The dashboard restyles.

**Hook up Supabase:**
1. Create a Supabase project, copy URL + anon key into `.env.local`.
2. Open Supabase SQL Editor, run migrations 001 + 003 in order.
3. Restart `npm run dev`. Lead-capture form starts persisting; CRM tab is still disk-backed (Supabase wiring for that surface ships in a later version).

---

## Meta integration (W5.B)

### OAuth flow

1. Customer clicks "Connect Meta" on the Settings > Integrations panel.
2. The browser navigates to `/api/meta/oauth/start?return_to=<current_url>`.
3. The Pages Function `functions/api/meta/[[path]].js` reads `ETERNIUM_API_KEY` from env and POSTs to `api.eternium.ai/v1/workspace/meta/oauth/start` with `{return_to}`.
4. Upstream returns a 302 redirect to Facebook's OAuth dialog. The Pages Function forwards this redirect to the browser.
5. The customer authorizes the Centramind Meta app on Facebook.
6. Meta redirects the customer to `api.eternium.ai/v1/workspace/meta/oauth/callback`.
7. The Eternium API stores the Meta access/refresh tokens in its `oauth_credentials` table (centrally managed).
8. The Eternium API redirects the customer back to the `return_to` URL with `?meta=connected&pages=N` query params.
9. The Integrations panel detects the callback params on mount, shows a success toast, and strips the params from the URL.

### Pages Function proxy pattern (`/api/meta/*`)

`functions/api/meta/[[path]].js` is a Cloudflare Pages catch-all function. It reads `ETERNIUM_API_KEY` from the deployment env (same pattern as `functions/api/chat.js`) and proxies all requests to `api.eternium.ai/v1/workspace/meta/*` with `Authorization: Bearer <key>` attached server-side. The browser never sees the API key or Meta tokens.

Supported routes:
- `GET /api/meta/oauth/start?return_to=...` - initiates OAuth
- `GET /api/meta/pages` - lists connected Facebook pages
- `POST /api/meta/post` - publishes a post to a selected page
- `GET /api/meta/ads/accounts` - lists ad accounts
- `GET /api/meta/ads/insights` - returns ad insights (query string forwarded)

### Integrations tab location

The Meta integration UI lives inside the Settings tab as an "Integrations" section (the `IntegrationsPanel` component in `CentraMindDashboard.jsx`). It renders a Meta card with two states: not-connected (shows a "Connect Meta" button) and connected (lists pages and provides a test-post form).

### Meta credentials management

Meta credentials (access tokens, refresh tokens) are managed centrally by the Eternium API. Customers never see the underlying Meta app credentials. The customer's deployment only stores `ETERNIUM_API_KEY`, which authenticates the proxy requests. All Meta tokens live in Eternium's central Supabase via the API proxy.

---

## Versioning

This template uses semver. Major versions may change the on-disk state shape; minor versions add features without breaking existing state; patch versions are bug fixes. Check `CHANGELOG.md` before upgrading. Hold onto your current commit hash if you have heavy local customizations -- you can always cherry-pick changes selectively.

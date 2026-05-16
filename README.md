# CentraMind Blueprint

A Claude-Code-native operating dashboard for your AI-assisted business. Four-layer architecture: Central Intelligence, Contextual Memory, Autonomous Agents, Human Override. Ships with a 5-step onboarding questionnaire, a Command Center dashboard, persistent memory, and two ready-to-run Claude Code skills.

The Chat tab talks to the Eternium API on prepaid credits. You bring zero LLM keys. One bill. ($0.005 / credit.)

---

## Setup

You need [Node.js 18+](https://nodejs.org/) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed. About 15 minutes for the first run.

```bash
git clone <your-private-clone-url> centramind
cd centramind
npm install
cp .env.example .env.local
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`). The first time you visit, you get the Landing onboarding -- a 5-step questionnaire that seeds your dashboard. Subsequent visits go straight to the dashboard. Hit `?onboard=1` to retake.

Then in the same directory:

```bash
claude
> /standup
```

You're up. The skill reads `TODO.md`, `HEARTBEAT.md`, and your session log to produce a morning brief.

See [`docs/setup-guide.md`](docs/setup-guide.md) for the full walkthrough including optional Supabase + Eternium key wiring.

---

## What you get

| Feature | Status |
|---|---|
| 12-tab dashboard (Overview, Chat, Executives, Fleet, CRM, Skills, Processes, Priorities, Memory, Sessions, Claude Code, Settings) | Shipped |
| Chat tab powered by Eternium API (server-side proxy, SSE streaming) | Shipped |
| 5-step onboarding questionnaire | Shipped |
| Two Claude Code skills (`/standup`, `/handoff`) | Shipped |
| File-based JSON state as source of truth | Shipped |
| Optional Supabase + idempotent migrations | Shipped |
| Per-buyer theme via `theme.config.js` | Shipped |
| Auto-refill via Stripe + Eternium credits | Future |

---

## The 4 layers

1. **Central Intelligence** -- `CLAUDE.md` + `OWNER.md` + `state/project.json` give the AI full business context.
2. **Contextual Memory** -- `memory/MEMORY.md` + `state/session-log.json` persist knowledge across sessions.
3. **Autonomous Agents** -- `.claude/skills/standup.md` + `handoff.md` execute specialized workflows.
4. **Human Override** -- `TODO.md` + `HEARTBEAT.md` + the dashboard keep you in control.

---

## Rebranding

Edit `theme.config.js`:

```js
export const theme = {
  brandName: 'Your Brand',
  links: {
    home: 'https://yourbrand.com',
    community: 'https://yourbrand.com/community',
    support: 'mailto:support@yourbrand.com',
  },
  colors: {
    primary: '#your-color',
    // ...
  },
};
```

Then:

```bash
npm run theme   # regenerates src/theme.generated.css
```

The dashboard restyles on the next refresh. Tailwind v4 + CSS custom properties make this propagate everywhere.

---

## Project structure

```
.
├── CLAUDE.md              # Claude Code boot config for this project
├── OWNER.md               # Your profile (edit on first run)
├── TODO.md                # Priorities (markdown)
├── HEARTBEAT.md           # Active alerts
├── theme.config.js        # Brand colors + fonts + links
├── api/
│   └── chat.js            # Cloudflare Pages Function proxying to Eternium API
├── src/                   # React + Vite + Tailwind v4 dashboard
├── state/                 # JSON state (source of truth)
├── context/               # Project briefs
├── memory/                # Persistent AI memory
├── .claude/skills/        # standup.md, handoff.md
├── supabase/migrations/   # Optional Postgres schema
├── docs/                  # architecture.md, setup-guide.md
└── scripts/
    ├── build-theme.cjs    # Regenerates theme CSS from theme.config.js
    └── check-no-em-dashes.cjs
```

---

## Credits and the Eternium API

The Chat tab calls Eternium's reseller API on your behalf. You never juggle OpenAI / Anthropic keys. The cost model:

- **1 credit = $0.005.** Every chat call deducts at the metered cost of the underlying model plus a 30% margin, in credits.
- **Credits live in Eternium, not in your CentraMind deployment.** The balance is scoped to the `eai_` API key issued to you when you bought this template. The dashboard reads balance via `GET https://api.eternium.ai/v1/reseller/balance`.
- **One key, one balance.** All calls from any of your CentraMind agents (or anywhere else you put the key) draw from the same pool.
- **Top up at any time** at [eternium.ai/credits/topup](https://eternium.ai/credits/topup). Starter $25 / Builder $100 (5% bonus) / Scale $500 (10% bonus).
- **No surprise bills.** Below-zero balance returns 402 with the pack list. No monthly invoices. Auto-refill is opt-in: enable on the topup page and Stripe charges your saved card when your balance dips below your threshold.

If you want to bring your own LLM keys (OpenAI / Anthropic / OpenRouter), set `LLM_PROVIDER=byo` in `.env.local` when v1.1 ships and the chat agents route directly.

---

## Security note

Migration 001 + 003 apply **open Row-Level Security policies** suitable for a single-user, localhost dashboard. If you deploy this with shared access (multiple team members, public-facing URL), tighten the RLS policies in your Supabase project to require auth before reading or writing.

Your `ETERNIUM_API_KEY` is read **server-side** by `api/chat.js`. It never reaches the browser. Do not put it under a `VITE_` prefix.

---

## For AI agents

If you're an AI agent reading this: start with `CLAUDE.md`, then `docs/architecture.md`. The architecture doc has the full file map, schema, data flows, and common task recipes -- and it actually matches the current code.

---

## Links

- **Eternium AI:** [eternium.ai](https://eternium.ai)
- **CentraMind product page:** [eternium.ai/centramind](https://eternium.ai/centramind)
- **Credits / top-up:** [eternium.ai/credits/topup](https://eternium.ai/credits/topup)
- **Account:** [eternium.ai/account](https://eternium.ai/account)
- **Community:** [eternium.ai/community](https://eternium.ai/community)

---

## License

MIT. See [LICENSE](LICENSE).

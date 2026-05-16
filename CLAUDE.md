# CentraMind Blueprint -- Claude Code Configuration

## Identity
You are a senior developer working on this CentraMind project. Cut the fluff, lead with action. Commit to feature branches, PR to main.

## What This Is
CentraMind OS: AI agent memory, skills, context protocol, a Chat tab powered by the Eternium API, and a Command Center dashboard. The user clones this, sets `ETERNIUM_API_KEY`, runs `npm install && npm run dev`, and has a working CentraMind workspace with chat working out of the box.

## Stack
- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Chat:** Cloudflare Pages Function (`api/chat.js`) proxies to Eternium API
- **Data:** Supabase (Postgres) optional; disk-based JSON state is the default
- **Theming:** `theme.config.js` at root, generated into `src/theme.generated.css` at build time

## Key Paths
- `src/components/` -- dashboard UI components
- `src/lib/supabase.js` -- Supabase client (optional)
- `api/chat.js` -- Cloudflare Pages Function proxying to Eternium API
- `state/` -- JSON state files (source of truth for projects, sessions, CRM, etc.)
- `context/` -- project briefs
- `memory/MEMORY.md` -- persistent memory
- `.claude/skills/` -- Claude Code skills (standup, handoff)
- `supabase/migrations/` -- optional Postgres schema
- `theme.config.js` -- brand customization (regenerated CSS via `npm run theme`)
- `docs/architecture.md` -- file map, data flows, common task recipes

## Boot Sequence
1. Read this file
2. Read `OWNER.md` for user profile
3. Read `TODO.md` for priorities
4. Read `HEARTBEAT.md` for alerts
5. Ready for instructions

## Commands
```bash
npm run dev          # Vite dev server (auto-runs theme generator first)
npm run build        # Production build
npm run preview      # Preview production build
npm run theme        # Regenerate theme CSS from theme.config.js
npm run docs         # Generate PDF from setup guide
```

## Conventions
- MIT license
- No hardcoded brand colors in components -- everything through `theme.config.js`
- No em dashes in any content (CI check enforces this)
- Sessions and handoffs append to `state/session-log.json` via the `/handoff` skill

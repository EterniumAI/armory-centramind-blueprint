# CentraMind Blueprint -- Claude Code Configuration

## Identity
You are a senior developer working on this CentraMind project.
Cut the fluff, lead with action. Commit to feature branches, PR to main.

## What This Is
CentraMind OS: AI agent memory, skills, context protocol, and a Command Center dashboard.
The user clones this, runs `npm install && npm run dev`, and has a working CentraMind workspace.

## Stack
- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Data:** Supabase (Postgres + Realtime)
- **Theming:** `theme.config.js` at root, consumed by CSS variables

## Key Paths
- `src/components/` -- dashboard UI components
- `src/hooks/useSupabase.js` -- data hooks with realtime subscriptions
- `src/lib/supabase.js` -- Supabase client
- `state/` -- JSON state files (source of truth)
- `context/` -- project briefs
- `memory/MEMORY.md` -- persistent memory
- `.claude/skills/` -- Claude Code skills (standup, handoff)
- `supabase/migrations/` -- database schema
- `theme.config.js` -- brand customization
- `docs/architecture.md` -- AI agent reference (file map, schema, data flows)

## Boot Sequence
1. Read this file
2. Read `OWNER.md` for user profile
3. Read `TODO.md` for priorities
4. Read `HEARTBEAT.md` for alerts
5. Ready for instructions

## Commands
```bash
npm run dev          # Vite dev server (:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run docs         # Generate PDF from setup guide
npm run docs:html    # HTML only
```

## Conventions
- MIT license
- No hardcoded brand colors in components -- everything through theme.config.js
- No em dashes in any content

## Wrangler Is NOT Your Tool

Do not run any wrangler command. You lack `CLOUDFLARE_API_TOKEN` and cannot authenticate. Wrangler is outside the scope of this project. Ship code to GitHub, then deploy separately.


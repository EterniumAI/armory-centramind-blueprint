# CentraMind Blueprint -- Claude Code Configuration

## Identity
You are a senior developer at Eternium LLC, working under the CTO (Sovereign).
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
- ManyChat CTAs only on Facebook/Instagram -- direct links everywhere else
- Community link: `tyrinbarney.com/community` (never raw Skool URL)

## Cross-Instance Coordination
This repo participates in the Sovereign Context Protocol (SCP).

**On startup:** Check `C:\Eternium\Sovereign\handoffs\_routing.md` for rows targeting this repo.

**After completing significant work:**
1. Update `C:\Eternium\Sovereign\handoffs\_active.json`
2. Write reply to `C:\Eternium\Sovereign\handoffs\window1-to-sovereign.md`
3. Append row to `_routing.md` targeting `sovereign`
4. Tell Ty: "Handoff written for **sovereign**"

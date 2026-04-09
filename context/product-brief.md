# CentraMind Blueprint: Product Brief

## What This Is
An Eternium Armory product: a deployable CentraMind workspace with a React Command Center dashboard. Part of The AI Builder's Playbook series (Episode 4/EP5 lead magnet).

## Product State
- **Status:** v1.0 shipped
- **Repo:** github.com/EterniumAI/armory-centramind-blueprint
- **Product page:** eternium.ai/products/centramind-blueprint
- **Demo:** centramind-blueprint.pages.dev (Cloudflare Pages)

## What the User Gets
1. A working CentraMind file structure (CLAUDE.md, state/, context/, skills/)
2. A React + Vite + Tailwind + Supabase Command Center dashboard
3. Two pre-built Claude Code skills (/standup, /handoff)
4. Supabase migration for the dashboard tables
5. A theme engine for 5-minute rebranding
6. Grandma-level PDF setup guide
7. AI agent architecture reference

## Architecture
- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Data:** Supabase (Postgres + Realtime)
- **File state:** JSON files in state/ (source of truth)
- **Dashboard:** Reads from Supabase, synced via /handoff skill
- **Theming:** theme.config.js at root, consumed by CSS variables

## Key Decisions
- File-based state is source of truth; Supabase mirrors it for the dashboard
- RLS is open (single-user); users tighten for multi-user
- Skills are markdown files in .claude/skills/, not code
- No backend server needed; pure client-side with Supabase

## Relationship to Sovereign
This is the "starter kit" version of what Sovereign runs at scale. Sovereign has 40+ tables, 20+ skills, multi-instance coordination, and production automation. This gives the user the core pattern: 4 layers, file-based context, dashboard visualization.

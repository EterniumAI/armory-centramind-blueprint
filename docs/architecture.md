# CentraMind Blueprint: Architecture Reference

> This document is for AI agents (Claude Code, Cursor, etc.), not humans.
> If you're a human, read the README instead.

## File Map

```
armory-centramind-blueprint/
├── CLAUDE.md                          # Agent boot config (read first)
├── OWNER.md                           # User profile and preferences
├── TODO.md                            # Current priorities
├── HEARTBEAT.md                       # Active alerts
├── theme.config.js                    # Brand colors, fonts, logos
├── .env.example                       # Environment variable template
│
├── src/                               # React + Vite application
│   ├── main.jsx                       # App entry point
│   ├── index.css                      # Tailwind v4 + theme variables
│   ├── App.jsx                        # Root component, layout
│   ├── lib/
│   │   └── supabase.js                # Supabase client init
│   ├── hooks/
│   │   └── useSupabase.js             # Data hooks with realtime subscriptions
│   └── components/
│       ├── Header.jsx                 # Brand name + date
│       ├── HeartbeatAlerts.jsx        # Unresolved alerts banner
│       ├── ProjectCards.jsx           # Project grid with progress bars
│       ├── SessionTimeline.jsx        # Session log timeline
│       ├── DirectivesPanel.jsx        # Collapsible directives list
│       ├── QuickActions.jsx           # Sync/Alert/Session modals
│       ├── StatusBadge.jsx            # Status/Priority/Severity badges
│       └── Skeleton.jsx               # Loading shimmer states
│
├── state/                             # JSON state files (source of truth)
│   ├── projects.json                  # Project registry
│   ├── directives.json                # Standing orders
│   └── session-log.json               # Session history
│
├── context/                           # Project briefs and context docs
│   └── product-brief.md               # This product's state and decisions
│
├── memory/
│   └── MEMORY.md                      # Persistent memory across sessions
│
├── .claude/skills/                    # Claude Code skills (invoke with /name)
│   ├── standup.md                     # Morning briefing
│   └── handoff.md                     # End-of-session state update
│
├── supabase/migrations/
│   └── 001_core_schema.sql            # Dashboard database tables
│
├── docs/
│   ├── setup-guide.md                 # PDF source (grandma-level quickstart)
│   └── architecture.md                # THIS FILE
│
└── scripts/
    └── build-pdf.cjs                  # Markdown to branded HTML/PDF
```

## Database Schema

Four tables in Supabase, defined in `supabase/migrations/001_core_schema.sql`:

### projects
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| slug | text | Unique identifier |
| name | text | Display name |
| status | text | active, paused, completed, archived |
| description | text | One-line summary |
| completeness | numeric(3,2) | 0.00 to 1.00 |
| stack | text[] | Technology list |
| blockers | text[] | Current blockers |
| next_actions | text[] | Next steps |
| deployment_url | text | Live URL |
| deployment_status | text | none, staging, live |
| repo_url | text | GitHub URL |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto via trigger |

### session_logs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| session_id | text | Unique, e.g. "S-001" |
| session_date | date | When it happened |
| duration | text | Optional |
| summary | text | What was accomplished |
| projects_touched | text[] | Which projects |
| completed | text[] | Done items |
| pending | text[] | Remaining items |
| decisions | text[] | Key decisions made |
| blockers | text[] | Active blockers |
| created_at | timestamptz | Auto |

### directives
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| directive_id | text | Unique, e.g. "d-001" |
| title | text | Short name |
| priority | text | low, medium, high, critical |
| rule | text | The directive text |
| status | text | active, paused, archived |
| created_at | timestamptz | Auto |

### heartbeat_alerts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | Alert title |
| severity | text | info, warning, critical |
| message | text | Alert details |
| resolved | boolean | Default false |
| resolved_at | timestamptz | When resolved |
| created_at | timestamptz | Auto |

## Data Flow

```
File State (state/*.json)
  -- user edits or /handoff skill updates -->
Supabase Tables
  -- realtime subscription -->
React Dashboard (src/components/*)
```

The file-based state in `state/` is the source of truth. Supabase mirrors it for the dashboard UI. The `/handoff` skill is the sync mechanism.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| VITE_SUPABASE_URL | Yes | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Yes | Supabase anonymous key |
| VITE_ETERNIUM_API_KEY | No | Eternium API (for AI features) |

## Theming

All visual customization flows through `theme.config.js` at the project root. The CSS variables in `src/index.css` map to theme values. Components use Tailwind classes that reference these variables (e.g., `text-primary`, `bg-bg-card`).

To rebrand:
1. Edit `theme.config.js` (colors, fonts, brand name)
2. Replace `public/assets/` logos
3. The dashboard updates automatically

## Common Agent Tasks

### Initial Setup
1. Read CLAUDE.md for project context
2. Run `npm install`
3. Copy `.env.example` to `.env`, fill in Supabase credentials
4. Run the SQL migration in Supabase
5. Run `npm run dev`

### Add a New Skill
1. Create `.claude/skills/your-skill.md` with frontmatter `description`
2. Define the workflow in markdown
3. Test with `/your-skill` in Claude Code

### Add a New Project
1. Add entry to `state/projects.json`
2. INSERT matching row in Supabase `projects` table
3. Create `context/your-project-brief.md`

### Rebrand for a Client
1. Edit `theme.config.js`: brandName, colors, fonts
2. Replace logos in `public/assets/`
3. Update `OWNER.md` with client info
4. Run `npm run build` to verify

### Add a Dashboard Section
1. Create component in `src/components/`
2. Add a hook in `src/hooks/useSupabase.js` if new table needed
3. Add migration SQL in `supabase/migrations/`
4. Import and render in `src/App.jsx`

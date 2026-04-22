# CentraMind Blueprint

AI agent memory, skills, context protocol, and a Command Center dashboard. Build in 50 minutes.

This is the exact architecture that runs [Eternium](https://eternium.ai). The pattern is CentraMind: a file-based knowledge graph that any AI agent can read and write, plus an Orchestrator agent that delegates to a fleet of operators. The Command Center dashboard visualizes your entire operation in real time.

## Two Paths

### Managed (Eternium SaaS)
Sign in at [eternium.ai](https://eternium.ai), get an API key, and your Command Center is already hosted. No clone needed.

### Self-Hosted (this repo)

```bash
git clone https://github.com/EterniumAI/armory-centramind-blueprint.git
cd armory-centramind-blueprint
npm install
cp .env.example .env   # fill in your Supabase credentials
npm run dev
```

Or hand it to Claude Code:
```bash
claude
> Set up this project. My Supabase URL is [url] and anon key is [key].
```

## What You Get

| Feature | Description |
|---------|-------------|
| 4-layer architecture | Central Intelligence, Contextual Memory, Autonomous Agents, Human Override |
| Command Center dashboard | React + Vite + Tailwind + Supabase with real-time updates |
| Claude Code skills | `/standup` for morning briefings, `/handoff` for end-of-session state sync |
| File-based state | JSON state files as source of truth, mirrored to Supabase |
| Theme engine | `theme.config.js` for 5-minute rebranding |
| Supabase migration | One SQL file creates all dashboard tables |

## The Four Layers

1. **Central Intelligence** - CLAUDE.md + OWNER.md + directives give AI full business context
2. **Contextual Memory** - Session logs + project briefs + MEMORY.md persist knowledge across sessions
3. **Autonomous Agents** - Skills in `.claude/skills/` let AI execute specialized workflows
4. **Human Override** - TODO.md + HEARTBEAT.md + the Command Center keep you in control

## Setup

### 1. Supabase
Create a free project at [supabase.com](https://supabase.com). Go to SQL Editor, paste `supabase/migrations/001_core_schema.sql`, click Run. Copy your Project URL and Anon Key from Settings > API.

### 2. Environment
```bash
cp .env.example .env
```
Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 3. Run
```bash
npm run dev
```
Open `http://localhost:5173`.

### 4. Configure Your Workspace
- Edit `OWNER.md` with your info
- Edit `state/projects.json` with your projects
- Edit `state/directives.json` with your rules
- Edit `TODO.md` with your priorities

### 5. Use It
```bash
claude              # start Claude Code in this directory
> /standup          # morning briefing
> /handoff          # end-of-session state sync
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run docs` | Generate PDF from setup guide |
| `npm run docs:html` | Generate HTML only (no puppeteer needed) |

## Rebranding

Edit `theme.config.js`:

```js
export const theme = {
  brandName: 'Your Brand',
  colors: {
    primary: '#your-color',
    // ...
  },
};
```

Replace logos in `public/assets/`. Done.

## Project Structure

```
armory-centramind-blueprint/
├── CLAUDE.md              # AI agent boot config
├── OWNER.md               # Your profile
├── TODO.md                # Priorities
├── HEARTBEAT.md           # Active alerts
├── theme.config.js        # Brand customization
├── src/                   # React dashboard app
├── state/                 # JSON state (source of truth)
├── context/               # Project briefs
├── memory/                # Persistent AI memory
├── .claude/skills/        # Claude Code skills
├── supabase/migrations/   # Database schema
├── docs/                  # Setup guide + architecture ref
└── scripts/               # PDF builder
```

## For AI Agents

If you're an AI agent reading this: start with `CLAUDE.md`, then `docs/architecture.md`. The architecture doc has the full file map, database schema, data flows, and common task recipes.

## Links

- **Product page:** [eternium.ai/products/centramind-blueprint](https://eternium.ai/products/centramind-blueprint)
- **API keys:** [eternium.ai/api](https://eternium.ai/api)
- **Community:** [tyrinbarney.com/community](https://tyrinbarney.com/community)
- **Full tutorial:** The AI Builder's Playbook, Episode 4

## License

MIT. See [LICENSE](LICENSE).

---

Built by [Eternium LLC](https://eternium.ai). Part of The AI Builder's Playbook by [Tyrin Barney](https://tyrinbarney.com).

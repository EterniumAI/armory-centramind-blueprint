# CentraMind Blueprint: Quick Start

You just got your hands on the system that runs Eternium. Not a watered-down version. The actual architecture. Let's get you running.

## Two Paths

### Path 1: Start Immediately (2 minutes)

Already have an Eternium account? Skip the clone entirely.

1. Go to [eternium.ai/products/centramind-blueprint](https://eternium.ai/products/centramind-blueprint)
2. Sign in and grab your API key
3. Your Command Center dashboard is already hosted

Done. You're in. The dashboard reads from your Supabase project, and the API handles the heavy lifting.

### Path 2: Run It Yourself (15 minutes)

Want full control? Clone the repo and run it locally.

```
git clone https://github.com/EterniumAI/armory-centramind-blueprint.git
cd armory-centramind-blueprint
npm install
```

Set up Supabase (free tier works fine):
1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor, paste the contents of `supabase/migrations/001_core_schema.sql`, click Run
3. Copy your Project URL and Anon Key from Settings > API

Create your `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Fire it up:
```
npm run dev
```

Open `http://localhost:5173`. You should see your Command Center.

### Path 2b: Hand It to Claude Code (5 minutes)

If you have Claude Code installed, this is even faster:

```
git clone https://github.com/EterniumAI/armory-centramind-blueprint.git
cd armory-centramind-blueprint
claude
```

Then tell it:
```
Set up this project. I need a Supabase project created, the migration run, and the .env configured. My Supabase credentials are: [paste your URL and anon key].
```

Claude Code reads the CLAUDE.md, understands the project, and does the rest.

## What's Inside

| Layer | Files | Purpose |
|-------|-------|---------|
| Central Intelligence | CLAUDE.md, OWNER.md, state/directives.json | AI knows your business |
| Contextual Memory | state/session-log.json, memory/MEMORY.md | AI remembers across sessions |
| Autonomous Agents | .claude/skills/ | Reusable workflows (/standup, /handoff) |
| Human Override | TODO.md, HEARTBEAT.md, Command Center | You stay in control |

## What's Next

- Fill in OWNER.md with YOUR info (the AI is only as good as the context you give it)
- Run `/standup` every morning, `/handoff` every evening
- Add your own skills in `.claude/skills/`
- Read the full README for architecture details and rebrand instructions

## Get Help

- **Full docs:** [github.com/EterniumAI/armory-centramind-blueprint](https://github.com/EterniumAI/armory-centramind-blueprint)
- **Community:** [tyrinbarney.com/community](https://tyrinbarney.com/community)
- **API keys:** [eternium.ai/api](https://eternium.ai/api)
- **AI agent reference:** See `docs/architecture.md` in the repo (hand this to Claude Code)

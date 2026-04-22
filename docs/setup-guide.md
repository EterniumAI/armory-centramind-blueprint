# CentraMind Blueprint

You just got the system that runs Eternium LLC. Not a demo. Not a gutted sample. The actual architecture Tyrin Barney uses every day to run a one-person AI company.

This guide takes you from zero to a live Command Center in about 15 minutes.

---

## What CentraMind Is

A Claude Code operating system. Four layers, stacked:

| Layer | What it does |
|-------|--------------|
| Central Intelligence | Claude Code reads your business context the moment it wakes up |
| Contextual Memory | Persistent memory, session logs, skills that survive restarts |
| Autonomous Agents | Reusable workflows (/standup, /handoff, your own skills) |
| Command Center | A React dashboard that shows what Claude is doing, in real time |

You clone the repo. You wire it to Supabase. You open your Command Center. Claude Code is now running your business with you.

---

## Before You Start

You need five things. None of them cost money to start.

1. A computer (Mac, Windows, or Linux)
2. **Node.js 18 or newer**: [nodejs.org](https://nodejs.org)
3. **A free Supabase account**: [supabase.com](https://supabase.com) (this is your memory and database)
4. **Git**: [git-scm.com](https://git-scm.com) (ships preinstalled on Mac and Linux)
5. **Claude Code** (recommended, not required): [claude.com/claude-code](https://claude.com/claude-code)

If any of those words are new, stop, install them, come back. Everything else in this guide assumes they exist on your machine.

---

## Quick Start (the 15-minute path)

### Step 1. Clone the repo

Open a terminal and run:

```
git clone https://github.com/EterniumAI/armory-centramind-blueprint.git
cd armory-centramind-blueprint
npm install
```

That last line pulls the dependencies. Wait for it to finish.

### Step 2. Create your Supabase project

1. Log in to [supabase.com](https://supabase.com)
2. Click **New Project**. Name it anything. Pick the region closest to you.
3. Wait about a minute for it to provision.
4. Once it's ready, open the **SQL Editor** (left sidebar, looks like a database icon).
5. Open the file `supabase/migrations/001_core_schema.sql` in the repo you just cloned. Copy everything. Paste it into the SQL Editor. Click **Run**.

Your database now has the tables CentraMind needs.

### Step 3. Grab your Supabase keys

In your Supabase dashboard:

1. Click **Settings** (gear icon, bottom-left)
2. Click **API**
3. Copy the **Project URL** and the **anon / public** key

### Step 4. Create your .env file

In the repo folder, create a file named exactly `.env` and paste:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the placeholders with what you copied from Supabase.

### Step 5. Fire it up

Back in your terminal:

```
npm run dev
```

Open `http://localhost:5173` in your browser.

You should see your Command Center. If you do, you just cloned the operating system that runs a real AI company.

---

## The Claude Code Shortcut

5 minutes instead of 15.

If you installed Claude Code, this whole process compresses.

```
git clone https://github.com/EterniumAI/armory-centramind-blueprint.git
cd armory-centramind-blueprint
claude
```

Then in Claude Code, tell it:

> Set up this project. Create a Supabase project if I don't have one, run the migration, configure the .env, and start the dev server. My Supabase credentials are: [paste your URL and anon key here].

Claude Code reads the `CLAUDE.md` file that ships with this repo, understands the architecture, and handles the rest.

---

## Your First 10 Minutes Inside

Once the Command Center is running, do these four things in order.

1. **Open `OWNER.md`.** Replace the placeholder profile with yours. This is Claude's understanding of who you are. The better the profile, the better Claude operates.
2. **Open `TODO.md`.** Write three real tasks you want handled this week. Claude reads this on every session start.
3. **Run `/standup` in Claude Code.** Watch it summarize your day from memory, HEARTBEAT, and TODO.
4. **Run `/handoff` at the end of the day.** Watch it write the next session's boot briefing for itself.

You now have continuity. Claude Code no longer forgets.

---

## What's Inside The Repo

| Path | What lives there |
|------|------------------|
| `CLAUDE.md` | The identity Claude boots with |
| `OWNER.md` | Your profile. Claude reads this to understand you |
| `TODO.md` | Current priorities |
| `HEARTBEAT.md` | Active alerts and session state |
| `state/` | JSON source of truth (directives, session log) |
| `memory/MEMORY.md` | Persistent long-term memory |
| `.claude/skills/` | Your reusable workflows |
| `src/` | The Command Center React app |
| `supabase/migrations/` | Database schema |
| `theme.config.js` | Brand colors (rebrand the whole thing from one file) |

---

## Rebrand It

This is yours. The whole thing is MIT licensed. Rebrand, resell, run it inside your own company.

One file controls the entire visual system: `theme.config.js`. Change colors there, everything updates. No component-level color hunting.

---

## Where To Go Next

- **The full architecture reference:** `docs/architecture.md` in this repo. Hand it to Claude Code when you want it to reason about the system itself.
- **The source code:** [github.com/EterniumAI/armory-centramind-blueprint](https://github.com/EterniumAI/armory-centramind-blueprint)
- **The community:** [tyrinbarney.com/community](https://tyrinbarney.com/community). This is the Digital Armory. Questions get answered here. New plug-ins ship here first.
- **Tyrin's YouTube:** [youtube.com/@tyrinbarney](https://youtube.com/@tyrinbarney). Walkthroughs, full system tours, the stories of what broke and how we fixed it.

---

## You're Standing On The Real Thing

Every project at Eternium runs through a CentraMind instance. The website, the mobile apps, the clients, the content engine, the storefronts. All of them plug into this exact architecture.

You now have the same foundation. Build on it.

Ty

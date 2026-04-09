---
description: "Run a morning standup briefing"
---

# Morning Standup

Read the following files and give me a concise morning briefing:

1. **TODO.md** - What are my priorities today?
2. **HEARTBEAT.md** - Are there any active alerts?
3. **state/projects.json** - What's the status of each project?
4. **state/session-log.json** - What happened in the last session?
5. **memory/MEMORY.md** - Any relevant context I should remember?

Format the briefing as:

## Today's Priorities
[Top 3 items from TODO.md]

## Active Alerts
[Anything in HEARTBEAT.md, or "None"]

## Project Status
[One line per project: name, status, completeness, top blocker]

## Last Session Recap
[2-3 sentences summarizing the last session]

## Suggested First Task
[Based on priorities and last session, what should I work on first?]

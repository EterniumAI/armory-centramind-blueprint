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
6. **The CentraMind board** (when connected) - Which tasks are open or in progress, and who holds each? Use `dev_task_list` (include in-progress tasks) or `list_tasks`.

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
[Based on priorities and last session, what should I work on first? Name the existing task to claim, or say who already holds it. Do not start it until it is claimed, per *How to take on work in CentraMind* in AGENTS.md.]

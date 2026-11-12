---
description: "End-of-session handoff protocol"
---

# Session Handoff

Perform the end-of-session handoff:

1. **Session Log**: Append a new entry to state/session-log.json with:
   - Unique session ID (increment from last)
   - Today's date
   - Summary of what was accomplished
   - Projects touched
   - Completed items
   - Pending items
   - Key decisions made
   - Active blockers

2. **Project State**: Update state/projects.json with any changes to:
   - Status
   - Completeness percentage
   - Blockers
   - Next actions

3. **Context Briefs**: Update any context/*.md files that were affected

4. **Memory**: Add any key decisions or lessons to memory/MEMORY.md

5. **TODO**: Update TODO.md if priorities shifted

6. **Heartbeat**: Update HEARTBEAT.md if there are new alerts or resolved ones

7. **Board** (when connected to CentraMind): For every task worked this session, post progress, blockers, branch and pull request with `dev_task_update`. Use `dev_task_checkpoint` if the work is unfinished, or `dev_task_complete` with commits, pull requests and how you verified the work. Never leave a claimed task with stale status. If a status tool is refused, say so in the summary.

After updating, give me a summary of what changed.

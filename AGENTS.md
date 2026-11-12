# Agent instructions for this CentraMind workspace

Claude Code, Codex and other coding agents read this file. It is
self-contained: everything an agent needs to start work here is below or in
the files it names. Keep repo-specific instructions in `CLAUDE.md`.

## How to take on work in CentraMind

Before you start any work, including investigating, editing, or launching
another agent:

1. Find the existing task. Call `dev_session_start`, then search with
   `dev_task_list` (and `dev_board_read` when it is available). Create a task
   with `dev_task_create` only when none exists. Never file a duplicate.
2. Check who owns it. Look at the claim holder, the assigned session, and any
   linked branch, pull request, or session.
3. Claim it with `dev_task_claim`. If another session holds it, coordinate with
   that session through `dev_peer_send` and the `task_id`. Never work around or
   take over another session's claim.
4. Before you build, record your status. Use `dev_task_update` to post a
   progress note, and add the branch and pull request as soon as each one
   exists.
5. Keep the task current until the work is done. Post progress and blockers
   with `dev_task_update`, use `dev_task_checkpoint` if you stop early, and
   finish with `dev_task_complete`, including commits, pull requests, and how
   you verified the work.
6. If a claim or status tool is refused or missing, tell the user what is
   blocked and stop. Do not work around it, and do not present untracked work
   as tracked.

Why: the board is how everyone working in this workspace, people and agents
alike, knows what is happening. Work that is not on it gets duplicated or lost.

**Connected without the coding tools** (for example claude.ai, ChatGPT or another
client that has no claim tool): before starting work, search `list_tasks` for
the existing task and create one with `create_task` only if none exists; check
its assignee, and if you cannot record that you are working it, tell the user
rather than presenting the work as tracked.

**Not connected to CentraMind yet:** the same rule applies to the local state
files. Find the item in `TODO.md` or `state/projects.json` before adding a new
one, check its status and blockers, mark it in progress before you build, and
keep its status, blockers and next actions current until it is done.

## Sessions

- Start a session with `/standup`.
- End every session with `/handoff`, which records progress in
  `state/session-log.json` and brings the board or local task status up to date.

# Repository reconciliation: EterniumAI/armory-centramind-blueprint

Date: 2026-09-01
Repo id: `50dbe515-aaf3-47d8-aafc-236c0f0e5e76`
Default branch: `main` @ `a3c9736` ("docs: add the shared CentraMind agent adapter")
Prepared by: `alpha-worker-90f6e697` (task `90f6e697-8f35-43c3-a492-bb77ac77a774`)

## Why this record exists

The Forge repository audit reported 5 unknown refs, 2 conflicted refs, 0 unique
releasable refs, and 0 evidence gaps. This document classifies all 7 refs with
positive evidence, records the access gaps the audit did not surface, and leaves
an explicit disposition for each ref.

Nothing was merged, deleted, closed, or pushed in producing this record. See
"Authorization status" below.

## Corrected headline

The audit's summary was directionally wrong in two ways:

- **"5 unknown"** resolves to 3 fully merged, 1 fully absorbed, and 1 stale
  snapshot holding a single unique file. None are actually unknown.
- **"0 unique releasable refs"** is incorrect. PR #62 carries 262 lines of
  carousel work that is not on `main` by any path, and the recovery snapshot
  holds `.claude/launch.json`, which exists nowhere else.

The audit's `merged_pr_not_reachable` / `merge_sha_not_on_default` signal is a
false positive on this repo. The PR *merge commit* shas are not on `main`, but
the PR *head* shas are ancestors of `main`. The content shipped; only the merge
topology differs, which is expected for squash or rebase merges.

## Classification table

| Ref | Audit said | Verified | Disposition |
|---|---|---|---|
| `feat/mvp-polish` (PR #1) | unknown | merged | Close as merged. Deletion recommended, not authorized. |
| `feat/template-migration-003` (PR #3) | unknown | merged | Close as merged. Deletion recommended, not authorized. |
| `feat/template-tier1-packaging` (PR #4) | unknown | merged | Close as merged. Deletion recommended, not authorized. |
| `wip/armory-blueprint-20260820` | unknown | absorbed, patch-equivalent to `main` tip | Close as superseded. Deletion recommended, not authorized. |
| `recovery/unborn-worktree-2026-08-12` | unknown | stale snapshot, 1 unique artifact | **Retain.** Repair: lift `.claude/launch.json` via a normal PR, then supersede. |
| `fix/template-claude-md-identity` (PR #5) | conflicted | obsolete, merging is a regression | **Do not merge.** Close PR #5 as obsolete. |
| `feat/carousel-v2-blueprint-port` (PR #62) | conflicted | unique and releasable, 1 commit behind | **Repair then release.** Refresh from `main`, then request purpose-specific approval. |

## Per-ref evidence

### 1. `feat/mvp-polish` -- PR #1 -- `ad7769bb1bf960ee3337c9e389df9615dfaf94ab`

Verified classification: **merged**.

Evidence: `git branch -r --contains ad7769bb` lists `origin/main`. The head
commit is an ancestor of the default branch, so every line of this branch is on
`main`.

The audit's `merge_sha_not_on_default` reason describes the PR's merge commit,
not its content. Content reachability is the stronger signal and it is positive.

Disposition: close PR #1 as merged. The branch is safe to delete on the evidence,
but deletion is **not authorized** by this task. Recommended, not executed.

### 2. `feat/template-migration-003` -- PR #3 -- `3965394e89ae5855b4199d798cf7d6a4dde8d8cf`

Verified classification: **merged**. Same evidence and same reasoning as PR #1:
`git branch -r --contains 3965394e` lists `origin/main`.

Disposition: close as merged. Deletion recommended, not authorized.

### 3. `feat/template-tier1-packaging` -- PR #4 -- `bbab179519c39b4eb7baf23c5dc7ef8208ab70d7`

Verified classification: **merged**. Same evidence: `git branch -r --contains
bbab1795` lists `origin/main`.

Disposition: close as merged. Deletion recommended, not authorized.

### 4. `wip/armory-blueprint-20260820` -- `6abe739a6ab2f360dd1ac6db0b79fe237a3e0f09`

Verified classification: **absorbed into `main`, zero unique content**.

Evidence:

- `git diff origin/wip/armory-blueprint-20260820 origin/main` produces **no
  output**. The two trees are byte-identical.
- Both commits share parent `10909c1`.
- Both apply the same patch: `AGENTS.md` +10, `CLAUDE.md` +2.
- The WIP commit is dated 2026-08-20T16:31; `main` tip `a3c9736` is dated
  2026-08-20T23:40 and is the same change committed properly seven hours later.

This branch was a working-tree preservation snapshot that was subsequently
committed to `main` through the normal path. It carries nothing that `main`
lacks.

Disposition: close as superseded by `a3c9736`. The branch is safe to delete on
the evidence. Deletion recommended, **not authorized**.

### 5. `recovery/unborn-worktree-2026-08-12` -- `c06b9448330b30f8a527d907fa4e210868ef2e37`

Verified classification: **stale full-tree snapshot holding exactly one unique
artifact**. This is the ref the audit most badly mischaracterized.

Evidence:

- Single orphan root commit, 147 files, 29,279 insertions, no shared ancestry
  with `main`.
- A plain `git diff origin/main origin/recovery/...` shows 37 changed files and
  roughly 16,000 changed lines, which reads alarming.
- Nearly all of that is line-ending noise. The changed-line counts are exactly
  double the file sizes (`deploy.yml` 76 lines shows 152 changes;
  `provision-tenant.yml` 113 shows 226; `chat.js` 148 shows 296). Every line is
  deleted and re-added, the signature of a CRLF versus LF difference.
- `git diff --numstat --ignore-all-space origin/main origin/recovery/...`
  collapses 37 files to 7:

```
11	0	.claude/launch.json
0	10	AGENTS.md
0	2	CLAUDE.md
11	10	package-lock.json
0	1	package.json
0	7	src/index.css
0	249	src/lib/admin-api-mock.js
```

Reading that correctly: `main` is ahead on `AGENTS.md`, `CLAUDE.md`,
`package.json`, `src/index.css`, and `src/lib/admin-api-mock.js`. The snapshot's
other 140 files are identical to `main`. The only content that exists on this ref
and nowhere else is `.claude/launch.json`, an 11-line Vite launch configuration:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "vite",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 5173
    }
  ]
}
```

Disposition: **retain the branch.** It is not safe to delete while it is the sole
carrier of a file. Repair path: open a small PR adding `.claude/launch.json` to
`main`, or make a deliberate decision to drop it. Once that file is either landed
or explicitly declined, this ref becomes fully superseded and deletable under a
future authorization. Do not merge the branch itself. It has no common ancestor
with `main` and would reintroduce CRLF endings across 36 files and revert five
files to older revisions.

### 6. `fix/template-claude-md-identity` -- PR #5 -- `706813379c64c54f9ea12ee6059d5f5884af9e24`

Verified classification: **obsolete. Merging it would be a regression.**

State: 2 ahead, 55 behind, 128 days old, CI missing, PR open.

Its two commits are:

```
7068133 fix(template): resolve merge conflict in CLAUDE.md wrangler section
7e0bd63 fix(template): strip fleet identity and SCP references from CLAUDE.md
```

Evidence that the purpose is already served:

- `git grep -i -E "fleet|SCP" origin/main -- CLAUDE.md` returns **no matches**.
  The stated goal, removing fleet identity and SCP references from the template
  `CLAUDE.md`, is already true on `main`.

Evidence that merging would regress:

- `git diff --stat origin/main origin/fix/template-claude-md-identity` spans 130
  files, +3,233 / -23,169. The branch predates essentially the entire Blueprint
  build out.
- The branch's `CLAUDE.md` is the pre-Chat-tab template. It has no reference to
  the Chat tab, `functions/api/chat.js`, `src/lib/chat-context.js`, or the
  `npm run theme` generation step, all of which `main` documents today.
- It also reinstates the "Wrangler Is NOT Your Tool" section that `main` no
  longer carries.

The audit's "conflicted" label is correct here and it is a genuine textual
conflict: both sides rewrote `CLAUDE.md` extensively.

Disposition: **do not merge.** Close PR #5 as obsolete with a pointer to this
record. Deletion recommended after closure, **not authorized**. No repair is
warranted; rebasing 128 days of drift to re-land a change that already shipped
has negative value.

### 7. `feat/carousel-v2-blueprint-port` -- PR #62 -- `e969f4c6444eb8d692b456cc6c8a60dd09672288`

Verified classification: **unique and releasable, one commit behind `main`.**
This is the only ref on the repo with unmerged work worth shipping.

State: 3 ahead, 1 behind, 101 days old, CI missing, PR open.

```
e969f4c merge: resolve conflicts with main (keep V2 features)
f6ff9e0 feat(blueprint-carousel): sync V2 editor with latest source (From Research tab + hover-X delete)
296df87 feat(blueprint-carousel): port V2 editor + V2 templates + picker
```

Evidence that the work is genuinely unmerged:

- `git diff --stat origin/main...origin/feat/carousel-v2-blueprint-port` (merge
  base to branch) shows 5 files, +262 / -45:

```
 marketing/carousel/CarouselEditor.jsx        |   2 +
 marketing/carousel/ResearchMediaPicker.jsx   | 153 +++++++++++++-
 marketing/carousel/SlideEditor.jsx           |   2 +
 marketing/carousel/SlideListRail.jsx         |  52 ++++---
 marketing/carousel/SlidePreview.jsx          |  98 ++++++++---
```

- `main` already contains `10909c1 feat(blueprint-carousel): port V2 editor + V2
  templates + picker (#61)`, which is the same title as `296df87`. That earlier
  port did land. The net remaining delta above is therefore the `f6ff9e0`
  enhancement only, not a duplicate of #61. There is no double application.

Evidence that "conflicted" overstates the risk:

- The branch is behind by exactly one commit, `a3c9736`, which touches only
  `AGENTS.md` and `CLAUDE.md`.
- The branch's own three commits touch only the five carousel files above.
- Zero file overlap, so a real three-way merge resolves cleanly. The "conflicted"
  label here is an ahead-plus-behind artifact, not a textual conflict.

Release hazard to respect:

`git diff --stat origin/main origin/feat/carousel-v2-blueprint-port` (tip to tip)
shows `AGENTS.md` -10 and `CLAUDE.md` -2 in addition to the five carousel files.
Squashing that raw two-dot patch onto `main` would **delete the shared CentraMind
agent adapter**. Land this with a genuine merge or a rebase, never by applying the
tip-to-tip diff.

Disposition: **repair, then release under purpose-specific approval.**

1. Refresh the branch from `main` so it absorbs `a3c9736`.
2. Confirm CI, which is currently missing on this PR.
3. Request purpose-specific executive authorization to merge PR #62.

Step 3 is not satisfied today. See below.

## Authorization status

This task carries `push_policy: require_approval`, `approval_revision: 0`, and
`approval_purpose: null`. No purpose-specific approval exists for any ref on this
repo.

**Pre-existing generic approvals are explicitly recorded as non-authorizing for
these actions.** The workspace-level standing grant in `AGENTS.md` ("Alpha and
Sovereign both have permission to do everything", 2026-04-11) is a broad
operational grant. It is not a purpose-specific merge or delete authorization for
the refs in this record, and this task's own constraint supersedes it:

> Do not delete or merge without positive evidence and purpose-specific executive
> authorization.

Accordingly, this reconciliation executed **no** merges, deletions, PR closures,
or pushes to shared refs. Every disposition above is a recommendation awaiting a
named approval.

Actions requiring purpose-specific authorization before execution:

- Merge PR #62 after the refresh in section 7.
- Close PRs #1, #3, #4 as merged.
- Close PR #5 as obsolete.
- Delete `feat/mvp-polish`, `feat/template-migration-003`,
  `feat/template-tier1-packaging`, `wip/armory-blueprint-20260820`.
- Delete `recovery/unborn-worktree-2026-08-12`, and only after
  `.claude/launch.json` is landed or explicitly declined.
- Delete `fix/template-claude-md-identity` after PR #5 is closed.

## Access and evidence gaps

The audit reported 0 evidence gaps. That is not accurate for this run. Recorded
honestly:

1. **No network refresh.** `git fetch` was denied in this headless session. All
   evidence is drawn from remote-tracking refs as of the worktree's last fetch.
   All 8 remote branches were present locally, and every conclusion above is a
   reachability or content fact that a fetch could only add to, not invalidate.
   Still, PR states should be reconfirmed against GitHub before acting.
2. **No GitHub API access.** PR open/closed states, review status, and merge
   metadata are taken from the audit payload, not verified live.
3. **CI state unknown for both open PRs.** The audit reports `ci_state: missing`
   for PR #5 and PR #62, and reports `not_scanned` for the five other refs. No CI
   evidence was available to this run. PR #62 must not be released until CI is
   green.
4. **Audit `evidence.complete` flags are unreliable.** The two unassociated refs
   are marked `complete: false`, which was correct, but the three
   `merged_pr_not_reachable` refs are marked `complete: true` while carrying a
   false-positive classification. Treat that flag as advisory.

## Verification commands

Every claim above is reproducible with these read-only commands:

```bash
git branch -r --contains ad7769bb1bf960ee3337c9e389df9615dfaf94ab   # PR #1 -> lists origin/main
git branch -r --contains 3965394e89ae5855b4199d798cf7d6a4dde8d8cf   # PR #3 -> lists origin/main
git branch -r --contains bbab179519c39b4eb7baf23c5dc7ef8208ab70d7   # PR #4 -> lists origin/main
git branch -r --contains 706813379c64c54f9ea12ee6059d5f5884af9e24   # PR #5 -> branch only
git diff origin/wip/armory-blueprint-20260820 origin/main           # empty, trees identical
git diff --numstat --ignore-all-space origin/main origin/recovery/unborn-worktree-2026-08-12
git grep -i -E "fleet|SCP" origin/main -- CLAUDE.md                 # no matches
git diff --stat origin/main...origin/feat/carousel-v2-blueprint-port
git diff --stat origin/main origin/feat/carousel-v2-blueprint-port  # note AGENTS.md -10
```

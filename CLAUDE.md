# dogtail — Claude Code Context

## Project

dogtail is a browser-based knowledge graph explorer. Users explore a collection of markdown-authored knowledge bases as interactive directed graphs and export selected portions as human-readable or agent-ready documents.



## Workflow

- Branches: `feat/<phase>/<topic>` — one branch per task, created by human or agent at start of feature
- No git worktrees — agent works directly in the repo working tree
- Commits: imperative plain English, human only — agent writes code, human stages and commits after reviewing the diff
- PRs: self-reviewed, merged to `main`, branch deleted after merge
- Every task has a spec at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Chat is ephemeral — the spec is the persistent record
- Full workflow: `docs/superpowers/specs/2026-03-25-workflow-definition-design.md`

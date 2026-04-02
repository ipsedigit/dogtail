# Preview Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `/preview` slash command that runs `build:graph`, starts the dev server if needed, and opens the browser.

**Architecture:** A single skill file at `.claude/skills/preview/SKILL.md`. Claude reads it and executes the shell commands directly — no scripts, no npm changes.

**Tech Stack:** Claude Code skills, Bash (Windows: `netstat`, `start`)

---

### Task 1: Write the preview skill

**Files:**
- Create: `.claude/skills/preview/SKILL.md`

- [ ] **Step 1: Create the skill file**

Create `.claude/skills/preview/SKILL.md` with this exact content:

```markdown
---
name: preview
description: Use when the user wants to preview local changes to the knowledge base or source code. Runs build:graph, starts the dev server if needed, and opens the browser.
---

You are running the local preview workflow for the dogtail project.

Execute the following steps in order using the Bash tool:

## Step 1 — Build the graph

Run:
```bash
cd C:/repo/dogtail && npm run build:graph
```

Wait for it to complete. If it fails, show the error and stop.

## Step 2 — Check if dev server is running

Run:
```bash
netstat -ano | findstr :5173
```

If output is non-empty, the server is already running — skip Step 3.

## Step 3 — Start dev server (if not running)

Run in background:
```bash
npm run dev
```

Then poll until the server is ready:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

Repeat every 2 seconds until you get a 200 response (max 15 attempts). If it never responds, show an error.

## Step 4 — Open browser

Run:
```bash
start http://localhost:5173
```

Confirm to the user that the browser has been opened at `http://localhost:5173`.
```

- [ ] **Step 2: Verify the file exists and is readable**

Check that `.claude/skills/preview/SKILL.md` exists and the frontmatter is valid (has `name` and `description` fields).

- [ ] **Step 3: Smoke test the command**

In a Claude Code session, type `/preview`. Verify that:
- `build:graph` runs and completes
- The browser opens (or a message confirms the server was already running)

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/preview/SKILL.md docs/superpowers/specs/2026-04-02-preview-command-design.md docs/superpowers/plans/2026-04-02-preview-command.md
git commit -m "feat: add /preview command skill"
```

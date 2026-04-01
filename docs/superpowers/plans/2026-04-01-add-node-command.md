# `/add-node` Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Claude Code slash command that interactively guides the user through adding a new node to a dogtail knowledge base.

**Architecture:** A single prompt file at `.claude/commands/add-node.md`. The command accepts optional free-text `$ARGUMENTS`, infers fields from them, then asks for any missing information one field at a time before writing the node file.

**Tech Stack:** Claude Code custom commands (markdown prompt file), dogtail frontmatter schema (`src/types.ts`).

---

## File Map

- Create: `.claude/commands/add-node.md`

---

### Task 1: Create the `/add-node` command file

**Files:**
- Create: `.claude/commands/add-node.md`

- [ ] **Step 1: Create the `.claude/commands/` directory if it does not exist**

```bash
mkdir -p /c/repo/dogtail/.claude/commands
```

- [ ] **Step 2: Write `.claude/commands/add-node.md`**

```markdown
<!-- SOURCE OF TRUTH: src/types.ts (GraphNode, GraphEdge) and files in content/sample-kb/
     Update this command whenever the frontmatter schema or edge structure changes. -->

You are helping the user add a new node to a dogtail knowledge base.

The user may have provided some information in their message: $ARGUMENTS

Follow this exact flow:

## Step 1 — Parse arguments
From $ARGUMENTS, try to extract:
- title: a quoted string or a capitalized proper noun phrase
- type: any word following "type:" or "tipo:"
- overview: remaining descriptive text

Keep track of what you have inferred. You will ask only for fields that are still missing.

## Step 2 — Select kb
List the directories under `content/` in the repository. Present them to the user and ask which one to use. If only one exists, ask for confirmation instead.

## Step 3 — Collect missing fields (one question per message)
Ask only for fields not already inferred from arguments. Ask them in this order:

1. **title** — free text. This will also become the filename (e.g. "Claude Code" → `claude-code.md`).
2. **type** — free text. Look at the frontmatter `type:` values of existing files in the chosen kb and suggest them as options, but the user can type anything.
3. **overview** — one short sentence describing the node.

## Step 4 — Collect `from` edges (iterative)
List the existing node IDs in the chosen kb. Node IDs are the filenames without the `.md` extension (e.g. `claude-code`, `errors`, `bigbang`).

For each edge, ask:
1. Source node ID (from the list above, or typed manually)
2. Edge label (free text, e.g. "requires", "errorIs", "leadsTo")
3. "Add another edge? (y/n)"

Repeat until the user says no. Zero edges is valid — skip `from` entirely in that case.

## Step 5 — Collect content body (optional)
Ask: "Do you want to add a markdown body to this node now? (y/n)"
- If yes: accept the user's input as the body.
- If no: the body will be left empty.

## Step 6 — Preview and confirm
Show the full content of the file that will be written, including its path:

```
content/<kb>/<slug>.md
─────────────────────
---
type: <type>
title: <title>
overview: "<overview>"
from:
  - source: <source-id>
    edge: "<edge-label>"
---
<body>
```

Omit the `from` block if there are no edges. Omit the body if it is empty.

Ask: "Write this file? (y / n / edit <field>)"
- **y** → proceed to Step 7
- **n** → abort and let the user know the file was not written
- **edit <field>** → ask the user for a new value for that field, update it, then show the preview again

## Step 7 — Write file
Derive the slug from the title: lowercase, replace spaces and special characters with hyphens, remove consecutive hyphens.

Before writing, check if `content/<kb>/<slug>.md` already exists. If it does, warn the user and ask: "A file with this name already exists. Overwrite it? (y/n)"

Write the file to `content/<kb>/<slug>.md`. Confirm the full path that was written.
```

- [ ] **Step 3: Verify the command appears in Claude Code**

Run `/add-node` in the terminal. Claude Code should load the command prompt.

- [ ] **Step 4: Smoke test — full flow**

Run:
```
/add-node
```

Walk through the interactive flow manually:
1. No arguments provided → should ask for kb
2. Select a kb → should ask for title
3. Provide title, type, overview → should ask about edges
4. Add one edge, then decline second → should ask about body
5. Decline body → should show preview
6. Confirm → file should appear at `content/<kb>/<slug>.md`

Verify the written file matches the frontmatter schema in `src/types.ts`.

- [ ] **Step 5: Smoke test — arguments provided**

Run:
```
/add-node "Tool Use" type:tool
```

Expected: kb question appears, title pre-filled as "Tool Use", type pre-filled as "tool", only overview and edges asked.

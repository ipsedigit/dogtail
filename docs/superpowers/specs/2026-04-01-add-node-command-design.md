# `/add-node` Command Design

**Date:** 2026-04-01
**Status:** Approved

## Overview

A Claude Code slash command that guides the user through creating a new node in a dogtail knowledge base. Accepts optional free-text arguments, infers what it can, and interactively asks for any missing information before writing the file.

## File Location

`.claude/commands/add-node.md`

## Source of Truth

The node structure is defined in `src/types.ts` (`GraphNode`, `GraphEdge`) and exemplified by files in `content/sample-kb/`. **Update this command whenever the frontmatter schema or edge structure changes.**

## Frontmatter Schema (as of 2026-04-01)

```yaml
---
type: <string>
title: <string>
overview: "<string>"
from:
  - source: <node-id>
    edge: "<edge-label>"
---
<markdown body>
```

- `type`, `title`, `overview` are required.
- `from` is optional (zero or more edges).
- The filename is the slug derived from `title` (lowercase, spaces → hyphens, e.g. "Claude Code" → `claude-code.md`).
- The bigbang node has no `from` field.

## Interaction Flow

### Step 1 — Parse arguments
Read `$ARGUMENTS` (free text). Attempt to extract:
- **title**: a quoted string or a capitalized proper noun phrase
- **type**: any word following "type:" or "tipo:"
- **overview**: remaining descriptive text

Extracted values are used as defaults; the user can confirm or correct them during the interview.

### Step 2 — Select kb
List directories under `content/`. Ask the user to choose one. If only one exists, confirm rather than ask.

### Step 3 — Collect missing fields (one per message)
Ask only for fields not already inferred from arguments:

1. **title** — free text
2. **type** — free text (show existing types in the kb as suggestions)
3. **overview** — one-line description

### Step 4 — Collect `from` edges (iterative)
Show a list of existing node IDs in the chosen kb (derived from filenames, without `.md` extension).

For each edge:
- Ask: source node ID (from the list, or a new one typed manually)
- Ask: edge label (free text, e.g. "requires", "errorIs", "leadsTo")
- **After adding the edge**, display the full list of edges collected so far (e.g. "Edges so far: bigbang → hasResources")
- If the new edge is a duplicate (same source + same label as an existing entry), warn the user and skip adding it
- Ask: "Add another edge? (y/n)"

Repeat until the user answers no. Zero edges is valid.

### Step 5 — Collect content body (optional)
Ask if the user wants to add a markdown body now. If yes, accept multi-line input. If no, leave body empty.

### Step 6 — Preview and confirm
Display the full file content that will be written:

```
content/<kb>/<slug>.md
─────────────────────
---
type: ...
title: ...
overview: "..."
from:
  - source: ...
    edge: "..."
---
<body>
```

Ask: "Write this file? (y/n/edit)"
- **y** → write the file
- **n** → abort
- **edit** → go back to the field the user specifies

### Step 7 — Write file
Write to `content/<kb>/<slug>.md`. Confirm the path written.

## Edge Cases

- **Slug collision**: if a file with the same slug already exists, warn the user and ask to pick a different title or overwrite.
- **Empty body**: omit the body section from the file (write frontmatter only, no blank line after `---`).
- **No `from` edges**: omit the `from` field entirely from the frontmatter.

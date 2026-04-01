---
name: add-node
description: Use when the user wants to add a new node to a dogtail knowledge base. Guides through an interactive flow to collect node information and write the file.
---

<!-- SOURCE OF TRUTH: src/types.ts (GraphNode, GraphEdge) and files in content/sample-kb/
     Update this skill whenever the frontmatter schema or edge structure changes. -->

You are helping the user add a new node to a dogtail knowledge base.

The user may have provided some information in their message: $ARGUMENTS

Follow this exact flow:

## Step 1 — Parse arguments
From $ARGUMENTS, try to extract:
- title: a quoted string or a capitalized proper noun phrase
- type: any word following "type:" or "tipo:"
- overview: remaining descriptive text

Keep track of what you have inferred. You will ask only for fields that are still missing. If parsing is ambiguous, prefer to ask rather than guess.

## Step 2 — Select kb
List the directories under `content/` in the repository. Present them to the user and ask which one to use. If only one exists, ask for confirmation instead. If no directories are found under `content/`, tell the user and abort. They must create a kb directory first.

## Step 3 — Collect missing fields (one question per message)
Ask only for fields not already inferred from arguments. Ask them in this order:

1. **title** — free text. Once the user provides a title, derive the slug: lowercase, replace spaces and special characters with hyphens, remove consecutive hyphens. For non-ASCII characters (accents, etc.), strip or transliterate to ASCII. Show the user: "This will be saved as `<slug>.md`. OK?" If not OK, ask for a different title and re-derive. After the user confirms the slug, check if `content/<kb>/<slug>.md` already exists. If it does, warn the user and ask for a different title OR ask if they want to overwrite.
2. **type** — free text. Look at the frontmatter `type:` values of existing files in the chosen kb and suggest them as options (show up to 5 most common types as a comma-separated inline list), but the user can type anything. Skip any files with missing or incomplete frontmatter fields rather than erroring.
3. **overview** — one short sentence describing the node.

## Step 4 — Collect `from` edges (iterative)
Each entry in the `from` list represents another node that points TO this new node (i.e., an incoming edge). You are specifying who connects to this node, not who this node connects to.

List the existing node IDs in the chosen kb. Node IDs are the filenames without the `.md` extension (e.g. `claude-code`, `errors`, `bigbang`). Skip any files with missing or incomplete frontmatter fields rather than erroring.

For each edge, ask:
1. Source node ID (from the list above, or typed manually)
2. Edge label (free text, e.g. "requires", "errorIs", "leadsTo")
3. After adding, display the running list of edges collected so far (e.g. "Edges so far: bigbang → hasResources"). If the new edge is a duplicate (same source + same label already in the list), warn the user and skip it.
4. "Add another edge? (y/n)"

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
- **edit <field>** → ask the user for a new value for that field, update it, then show the preview again. Note: `from` is a list field. If the user types `edit from`, reply with 'n' and restart from Step 4 to redo the edge collection entirely.

## Step 7 — Write file
Write the file to `content/<kb>/<slug>.md` using the slug confirmed in Step 3. Write the file with LF line endings (not CRLF). Confirm the full path that was written.

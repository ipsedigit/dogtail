# Filename-Based Node IDs — Design

> **Status: APPROVED**

## Goal

Replace title-derived node IDs with filename stems. This decouples node identity from display title — titles can change freely without breaking connections between nodes.

## Current Behaviour

Node IDs are derived by running `slugify()` on the node's `title` frontmatter field. Edge `from:` entries also reference source nodes by title, which is then slugified to produce the source ID.

Problem: renaming a title silently breaks all edges that reference that node.

## New Behaviour

- Node ID = `path.basename(file, '.md')` — the filename stem, used as-is, no transformation.
- `slugify()` is deleted entirely.
- Edge `from:` entries reference source nodes by filename stem.
- Edge IDs are constructed as `${source}-${target}-${edgeType}` using raw filename stems.

## Frontmatter Schema Change

```yaml
# before
from:
  - source: "Claude Code"   # title string
    edge: "requires"

# after
from:
  - source: claude-code     # filename stem
    edge: "requires"
```

## Scope

- Change is entirely in `scripts/build-graph.ts`.
- The React app reads `graph.json` and uses whatever IDs it receives — no frontend changes needed.
- Content files (`content/**/*.md`) must be updated to use filename stems in their `from:` entries.

## Error Handling

If a `source` value in `from:` does not match any filename stem in the KB, a dangling edge is created (existing behaviour). No validation is added — out of scope.

## Convention

Filenames should be lowercase and hyphenated (e.g., `claude-code.md`). This is an authoring convention, not enforced by the build script.

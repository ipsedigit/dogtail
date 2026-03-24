# Stack Decision — Design

> **Status: APPROVED**

## Goal

Choose the technologies for dogtail: a local, browser-based knowledge graph explorer with a TUI-oriented dark UI.

## Constraints

- No backend — content is baked in at build time
- Deployable anywhere static (Vercel, Netlify, GitHub Pages) or run locally via Vite dev server
- User does not understand frontend; stack is chosen by the developer
- Output must be visually polished and usable

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend framework | React + TypeScript |
| Graph rendering | React Flow |
| Build / dev server | Vite |
| Build script | Node.js (TypeScript) |
| Styling | Plain CSS (CSS Modules) |
| Markdown rendering | `marked` |
| Frontmatter parsing | `gray-matter` |

## Architecture

```
content/
  *.md  (frontmatter: type, title, overview, from)
      ↓
  build script (Node.js/TypeScript)
      ↓
  public/graph.json  (nodes + edges, all metadata)
      ↓
  React app (Vite dev server)
      ↓
  React Flow canvas + detail panel
```

- The **build script** walks `content/`, parses frontmatter with `gray-matter`, and writes `public/graph.json`. Vite serves `public/` as static assets, so the app fetches `/graph.json` at startup.
- `graph.json` contains all nodes (id, type, title, overview, markdown content, file mtime) and edges (source, target, type, label).
- The **React app** loads `graph.json` once at startup via `fetch('/graph.json')`. In local dev, the user triggers a browser refresh to reload updated data. In production, `graph.json` is generated at deploy time and bundled as a static asset.
- **Local dev watch mode**: the build script watches `content/` for changes and overwrites `public/graph.json`. The user refreshes the browser to see updates.

## Frontmatter Schema

Every content node is a `.md` file. Required frontmatter fields:

```yaml
---
type: concept          # node type — user-defined string (e.g. concept, tool, resource, project)
title: Tool Use        # display title
overview: "..."        # one-sentence summary shown on the node card
---
```

Optional frontmatter fields:

```yaml
from:                        # edges pointing INTO this node
  - source: "Claude Code"    # title of the node this edge comes FROM
    edge: "requires"         # edge label (used as both type identifier and display text)
```

Edge direction: `source → this node`. If node `Tool Use` has `from: [{source: "Claude Code", edge: "requires"}]`, the resulting edge is `Claude Code → Tool Use` labeled `requires`.

The `edge:` value is stored as both `type` and `label` in `graph.json` (they are the same string). Example output edge: `{source: "claude-code", target: "tool-use", type: "requires", label: "requires"}`.

The **bigbang node** is identified by `type: bigbang` in its frontmatter. Each knowledge base must have exactly one bigbang node. It is the default starting point when the KB is opened.

## UI Design

### Visual style
- TUI-oriented dark theme: `#0d1117` canvas background, `#161b22` node cards
- Subtle dot-grid background
- Monospace typography for labels and metadata
- Node types are color-coded (top border + label color per type). Since types are user-defined strings, colors are assigned from a fixed palette in the order node types are first encountered during the build. The palette cycles if there are more types than palette entries.
- Edge types follow the same strategy: colors assigned from a separate fixed palette in the order edge labels are first encountered.
- Both palettes are defined as constants in the frontend code.

### Entry experience
- App opens on the **bigbang node** of the selected knowledge base
- Graph shows the bigbang node centered, with its direct neighbors visible
- Right panel shows the **KB overview** by default: name (from bigbang node title), description (from bigbang node overview), node type counts, and the 5 most recently modified nodes (by file mtime)
- Clicking a node switches the right panel to **node detail**: type, title, full markdown content, incoming and outgoing connections

### Node card anatomy
```
┌─────────────────────────┐
│ ● TYPE  (color-coded)   │
│ Title                   │
│ Short overview text     │
└─────────────────────────┘
```

### Edge anatomy
- Colored stroke per edge type
- Arrowhead matching stroke color
- Inline label on the edge path
- Edge type legend in the right panel footer

### Navigation
- Pan and zoom on the canvas (React Flow built-in)
- Click a node to select it (detail panel updates, node highlighted)
- Click a neighbor to re-center the graph on it (neighborhood view)
- `⌂ home` control returns to bigbang node
- `⌕ search` and `⊟ filter` controls in the header (out of scope for this spec — placeholders only in v1)

## Error Handling

If `public/graph.json` is missing or malformed at startup (e.g., build script has not been run), the app displays a full-screen error state with a message explaining that the build script must be run first (`npm run build:graph`). No partial rendering or fallback graph.

## Multiple Knowledge Bases

Multiple KB support (selection screen, unified view) is defined in the functional spec and out of scope here. This spec assumes a single KB loaded from `content/`. Multi-KB support will extend `graph.json` in a future spec.

## Rationale

**React Flow** was chosen over D3 or vanilla because it provides canvas pan/zoom, custom node components, and edge routing out of the box — exactly matching the card-node design. Building the same interaction layer with D3 would be significant work with no design benefit.

**Vite** keeps local dev fast and configuration minimal.

The **build script** is intentionally decoupled from the React app — the app only reads `graph.json`, making it easy to swap content or rebuild without touching the frontend.

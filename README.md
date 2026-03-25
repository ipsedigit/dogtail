# dogtail

A browser-based knowledge graph explorer. Explore collections of markdown-authored knowledge bases as interactive directed graphs and export selected portions as human-readable or agent-ready documents.

## What it does

- **Graph exploration** — navigate knowledge bases as interactive directed acyclic graphs; nodes and edges are visually distinct by user-defined types
- **Node interaction** — click a node to read its full markdown content and navigate to connected nodes
- **Multiple knowledge bases** — select from a list of KBs; each loads independently
- **Export** — filter by node/edge type and export as Markdown/PDF (human) or JSON (agent)

## Stack

| Layer | Choice |
|---|---|
| Frontend framework | React + TypeScript |
| Graph rendering | React Flow |
| Build / dev server | Vite |
| Build script | Node.js (TypeScript) |
| Styling | Plain CSS (CSS Modules) |
| Markdown rendering | `marked` |
| Frontmatter parsing | `gray-matter` |

## How it works

Content lives in `content/*.md` files with frontmatter defining node type, title, overview, and incoming edges. A build script walks the content directory and produces static JSON consumed by the React app — no backend required.

```
content/*.md  →  build script  →  public/graph/<kb>.json  →  React app
```

## Content format

```yaml
---
type: concept
title: Tool Use
overview: "Calling external functions from an LLM"
from:
  - source: "Claude Code"
    edge: "requires"
---

Full markdown content here.
```

## Development

```bash
npm install
npm run build:graph   # generate graph JSON from content/
npm run dev           # start Vite dev server
```

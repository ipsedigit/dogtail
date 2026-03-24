# Knowledge Graph — Draft Spec

> **Status: DRAFT** — captured during early brainstorming. Details are intentionally vague. Do not implement yet.

## What We're Building

A public template repository for tracking and visualising a **collection of knowledge bases** as interactive DAGs. Each knowledge base is an independent graph. The framework (structure, tooling, UI) is decoupled from the content (markdown files), so anyone can fork the repo, drop in their own content, and get their own knowledge graph site.

Primary use case: tracking learning about agentic coding, but generic enough for any domain.

## Core Concepts

- **Node** — a unit of knowledge, authored as a `.md` file. Nodes have a type (e.g. concept, tool, project, resource — TBD).
- **Edge** — a directed, typed relationship between nodes. Edges are defined as in-edges in the target node's frontmatter.
- **Graph** — a DAG (Directed Acyclic Graph) of all nodes and edges.

### Frontmatter shape (sketch)

```yaml
---
type: concept
from:
  - source: "Anthropic SDK"
    edge: "builds-on"
  - source: "Tool Use"
    edge: "requires"
---
```

## Architecture (Option A — SSG)

- **Build step** — walks `content/`, parses frontmatter, emits `graph.json`
- **Frontend** — loads `graph.json`, renders interactive DAG (library TBD: D3.js or Cytoscape.js)
- **Deploy target** — GitHub Pages (zero config)
- **Content folder** — `content/` is the only thing users need to replace when forking

## UI (high level)

- **Graph view** is the primary/main visualization — an interactive DAG of all nodes and edges
- Different sections of the app may use different interaction modes (TBD — e.g. list view, timeline, detail panel, search)
- Click a node → open its content (markdown rendered)
- Navigate the graph by following edges
- Visual distinction between node types and edge types

## Open Questions (to resolve in future brainstorming)

- What are the different sections/views beyond the graph, and what interaction patterns do they use?
- How are multiple knowledge bases structured and navigated (e.g. top-level selector)?

- What node types exist? Are they fixed or user-defined?
- What edge types exist? Are they fixed or user-defined?
- How exactly is content/structure decoupling enforced? (separate folder, git submodule, config file?)
- Graph layout algorithm (hierarchical DAG layout vs force-directed?)
- Search / filtering of nodes
- Tech stack for the frontend (plain JS, React, Vue?)
- Tech stack for the build script (Node, Python?)
- Mobile support?

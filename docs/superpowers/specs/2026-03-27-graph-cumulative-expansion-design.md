# Graph Cumulative Expansion

**Date:** 2026-03-27
**Status:** approved

## Problem

Clicking a node replaces the graph view with the clicked node's 1-hop neighborhood. Users want Neo4j-style cumulative expansion: click a node, keep existing nodes visible, and add its outgoing connections to the canvas.

## Design

### State change in `GraphPage.tsx`

Remove `focusNodeId: string` state. Add `visibleIds: Set<string>`, initialized with the bigbang node's ID when the graph loads.

`handleNodeClick` updates to:
1. Set `selectedNode` (unchanged — drives the right panel)
2. Add the clicked node's outgoing targets to `visibleIds`:

```ts
const targets = graphData.edges
  .filter(e => e.source === node.id)
  .map(e => e.target)
setVisibleIds(prev => new Set([...prev, node.id, ...targets]))
```

The `focusNodeId` prop on `<GraphCanvas>` is replaced by `visibleIds: Set<string>`.

### `GraphCanvas.tsx`

Replace the `focusNodeId: string` prop with `visibleIds: Set<string>`.

Rename `getNeighborhood` → `getVisibleSubgraph`. New implementation:

```ts
export function getVisibleSubgraph(graphData: GraphData, visibleIds: Set<string>) {
  const nodes = graphData.nodes.filter(n => visibleIds.has(n.id))
  const edges = graphData.edges.filter(e =>
    visibleIds.has(e.source) && visibleIds.has(e.target)
  )
  return { nodes, edges }
}
```

Edges appear only when both endpoints are visible. All other GraphCanvas internals (layout, rendering, click handler) are unchanged.

## Behaviour

- On load: bigbang node shown alone
- Click bigbang: tool-use and errors added to canvas
- Click tool-use: claude-code and anthropic-docs added
- Previously visible nodes are never removed
- No reset mechanism (navigating away and back resets naturally)

## Out of scope

- Collapse / reset controls
- Visual indicator for expanded vs. unexpanded nodes
- Any changes to the right panel

# Graph Navigation Redesign

**Date:** 2026-03-30
**Status:** approved

## Overview

Simplifies graph navigation by removing the in-splash history model (back/forward) and making neighbor chip clicks behave identically to clicking a node in the graph. The splash becomes a content viewer with a shortcut to adjacent nodes, not a navigation shell.

## Behavior

| Interaction | Result |
|---|---|
| Click node **without content** | `selectedNode` updated, `visibleIds` expanded (direct connections revealed) |
| Click node **with content** | Same as above, plus splash opens showing node content |
| Click same node again (with content) | Splash toggles off |
| Click neighbor chip in splash | Same as clicking that node in the graph: splash closes (or switches) based on whether the neighbor has content; `selectedNode` and `visibleIds` always update |
| Click backdrop or press Escape | Splash closes, graph unchanged |

## State — GraphPage

Remove the history variables introduced in `2026-03-29-splash-navigation-design.md`. Restore the simple single-node state:

```ts
const [splashNode, setSplashNode] = useState<GraphNode | null>(null)
```

Remove derived values `canGoBack`, `canGoForward` and helper functions `navigateSplash`, `splashBack`, `splashForward`.

### handleNodeClick

```ts
function handleNodeClick(node: GraphNode) {
  setSelectedNode(prev => prev?.id === node.id ? null : node)
  setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
  setSplashNode(prev => node.content.trim() ? (prev?.id === node.id ? null : node) : null)
}
```

### splashNeighbors memo

Unchanged from `2026-03-29-splash-navigation-design.md`.

### NodeSplash render

```tsx
{splashNode && (
  <NodeSplash
    node={splashNode}
    color={nodeColors[splashNode.type] ?? 'var(--text-dim)'}
    neighbors={splashNeighbors}
    onClose={() => setSplashNode(null)}
    onNavigate={handleNodeClick}
  />
)}
```

## Component — NodeSplash

### Props

```ts
interface Props {
  node: GraphNode
  color: string
  neighbors?: NeighborEntry[]
  onClose: () => void
  onNavigate?: (node: GraphNode) => void
}
```

Remove: `canGoBack`, `canGoForward`, `onBack`, `onForward`.

### Structure

Header row simplified to close button only (`.node-splash-close`). Remove `.node-splash-nav` and its back/forward buttons. The rest of the card (type badge, title, accent line, overview, markdown, connected chips) is unchanged.

Neighbor chips call `onNavigate?.(neighbor.node)` on click — which at the GraphPage level is `handleNodeClick`. This updates `selectedNode`, expands `visibleIds`, and opens or closes the splash depending on whether the neighbor has content.

### CSS

Remove `.node-splash-nav` rules. No new classes needed.

## Tests

### GraphPage.test.tsx

Remove:
- Tests for `navigateSplash`, `splashBack`, `splashForward`
- Tests for `canGoBack` / `canGoForward`

Add:
- Clicking a neighbor chip selects the neighbor node (`selectedNode` updated)
- Clicking a neighbor chip expands `visibleIds` to include the neighbor's connections
- Clicking a neighbor chip with content opens the splash for that neighbor
- Clicking a neighbor chip without content closes the splash

### NodeSplash.test.tsx

Remove:
- Tests for back/forward button enabled/disabled states
- Tests for `onBack` / `onForward` callbacks

Keep (unchanged):
- Renders "Connected" section when neighbors are present
- Clicking a chip calls `onNavigate` with the correct node

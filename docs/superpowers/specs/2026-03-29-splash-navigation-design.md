# Splash Navigation

**Date:** 2026-03-29
**Status:** approved

## Overview

While the NodeSplash is open, the user can navigate to connected nodes (neighbors) without closing the splash, and move back and forward through their visit history. The main graph (`selectedNode`, `visibleIds`) stays in sync with every navigation step.

## State — GraphPage

Replace `splashNode: GraphNode | null` with:

```ts
const [splashHistory, setSplashHistory] = useState<GraphNode[]>([])
const [splashIndex, setSplashIndex] = useState<number>(-1)
```

Derived values (no extra state):

```ts
const splashNode   = splashHistory[splashIndex] ?? null
const canGoBack    = splashIndex > 0
const canGoForward = splashIndex < splashHistory.length - 1
```

### Helper functions

| Function | Behaviour |
|---|---|
| `navigateSplash(node)` | Truncates forward history (`slice(0, splashIndex + 1)`), appends node, increments index; also calls `setSelectedNode(node)` and `setVisibleIds(prev => expandVisibleIds(..., node.id))` |
| `splashBack()` | Decrements index; syncs `selectedNode` + `visibleIds` to the node at the new index |
| `splashForward()` | Increments index; syncs `selectedNode` + `visibleIds` to the node at the new index |

### Updated handleNodeClick

```ts
function handleNodeClick(node: GraphNode) {
  setSelectedNode(prev => prev?.id === node.id ? null : node)
  setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
  if (node.content.trim()) {
    if (splashHistory[splashIndex]?.id === node.id) {
      setSplashHistory([])
      setSplashIndex(-1)
    } else {
      setSplashHistory([node])
      setSplashIndex(0)
    }
  } else {
    setSplashHistory([])
    setSplashIndex(-1)
  }
}
```

> Note: toggle (same node closes splash) is preserved.

### splashNeighbors memo

```ts
const splashNeighbors = useMemo(() => {
  if (!graphData || !splashNode) return []
  const seen = new Set<string>()
  const result: { node: GraphNode; edgeLabel: string; color: string }[] = []
  for (const edge of graphData.edges) {
    let neighborId: string | null = null
    let label = edge.label
    if (edge.source === splashNode.id) neighborId = edge.target
    else if (edge.target === splashNode.id) neighborId = edge.source
    if (!neighborId || seen.has(neighborId)) continue
    seen.add(neighborId)
    const neighbor = graphData.nodes.find(n => n.id === neighborId)
    if (neighbor) result.push({ node: neighbor, edgeLabel: label, color: nodeColors[neighbor.type] ?? 'var(--text-dim)' })
  }
  return result
}, [graphData, splashNode, nodeColors])
```

### NodeSplash render call

```tsx
{splashNode && (
  <NodeSplash
    node={splashNode}
    color={nodeColors[splashNode.type] ?? 'var(--text-dim)'}
    neighbors={splashNeighbors}
    canGoBack={canGoBack}
    canGoForward={canGoForward}
    onClose={() => { setSplashHistory([]); setSplashIndex(-1) }}
    onNavigate={navigateSplash}
    onBack={splashBack}
    onForward={splashForward}
  />
)}
```

## Component — NodeSplash

### Updated props

```ts
interface Props {
  node: GraphNode
  color: string
  neighbors: { node: GraphNode; edgeLabel: string; color: string }[]
  canGoBack: boolean
  canGoForward: boolean
  onClose: () => void
  onNavigate: (node: GraphNode) => void
  onBack: () => void
  onForward: () => void
}
```

### Card structure (top to bottom)

1. **Header row** — flex row, space-between:
   - Left: `← back` and `→ fwd` buttons (`.node-splash-nav`); each `disabled` + visually dimmed when the corresponding flag is false
   - Right: `✕ close` button (unchanged)
2. Type badge, title, accent line, overview, markdown content — unchanged
3. **Connected section** (rendered only when `neighbors.length > 0`):
   - Small uppercase label "Connected"
   - Flex-wrap row of chips (`.node-splash-chip`); each chip shows `● {node.title}` in `neighbor.color`; clicking calls `onNavigate(neighbor.node)`

### CSS additions (app.css)

| Class | Purpose |
|---|---|
| `.node-splash-nav` | Flex row gap for back/fwd buttons |
| `.node-splash-chip` | Neighbor pill — `background: var(--surface-raised)`, border, border-radius, padding, cursor |

## Tests

### NodeSplash.test.tsx additions

- Renders "Connected" section when neighbors array is non-empty
- Does not render "Connected" section when neighbors is empty
- Clicking a neighbor chip calls `onNavigate` with the correct node
- Back button is disabled when `canGoBack` is false
- Back button calls `onBack` when `canGoBack` is true
- Forward button is disabled when `canGoForward` is false
- Forward button calls `onForward` when `canGoForward` is true

### GraphPage.test.tsx additions

- `navigateSplash` appends to history and updates `selectedNode`
- `splashBack` moves to the previous node in history
- `splashForward` moves to the next node after going back
- Opening a splash from the canvas (handleNodeClick) resets history
- Clicking a node without content closes the splash

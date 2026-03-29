# Node Content Splash

**Date:** 2026-03-29
**Status:** approved

## Overview

When a user clicks a node that has non-empty `content`, a centered modal overlay (splash) opens to display the node's full content. The existing click behavior — graph expansion and side panel update — is preserved unchanged.

## Trigger

`handleNodeClick` in `GraphPage` sets `splashNode` to the clicked node when `node.content.trim()` is non-empty. Clicking the same node again clears `splashNode` (toggle). Clicking a different node with content replaces `splashNode`. Nodes with empty content do not open a splash.

## State

`GraphPage` gains one new state variable:

```ts
const [splashNode, setSplashNode] = useState<GraphNode | null>(null)
```

`selectedNode` and `visibleIds` are unaffected.

## Component: NodeSplash

New file: `src/components/NodeSplash.tsx`

**Props:**
```ts
interface Props {
  node: GraphNode
  color: string       // nodeColors[node.type]
  onClose: () => void
}
```

**Structure:**
- Full-screen backdrop (`position: fixed; inset: 0; z-index: 100`) with `backdrop-filter: blur(4px)` and a dark semi-transparent overlay. Clicking the backdrop calls `onClose`.
- Centered card (`max-width: 640px; max-height: 80vh; overflow-y: auto`) that stops click propagation so clicks inside do not close the splash.
- Card contents (top to bottom):
  1. `✕ close` button — top-right absolute, calls `onClose`
  2. Type badge — `● TYPE` in `color`
  3. Title — large, bold
  4. Accent gradient line — `linear-gradient(to right, color, transparent)`
  5. Overview — italic, muted (only rendered if non-empty)
  6. Markdown content — rendered via `marked.parse`, styled with `.node-splash-content` (same rules as `.panel-content`)
- Escape key listener attached on mount via `useEffect`, cleaned up on unmount.

## CSS

New classes in `src/styles/app.css`:

| Class | Purpose |
|---|---|
| `.node-splash-backdrop` | Fixed full-screen overlay, blur, flex centering |
| `.node-splash-card` | Centered card, scroll, shadow, rounded corners |
| `.node-splash-close` | Absolute top-right close button |
| `.node-splash-type` | Small uppercase type badge |
| `.node-splash-title` | Large bold title |
| `.node-splash-accent` | 1px gradient line |
| `.node-splash-overview` | Italic muted overview text |
| `.node-splash-content` | Markdown body — mirrors `.panel-content` rules |

Visual style (option C from brainstorm):
- `background: #161b22`
- `border: 1px solid #484f58`
- `border-radius: 8px`
- `box-shadow: 0 8px 32px rgba(0,0,0,0.6)`
- Backdrop: `background: rgba(13,17,23,0.75); backdrop-filter: blur(4px)`

## Integration in GraphPage

`handleNodeClick` updated:

```ts
function handleNodeClick(node: GraphNode) {
  setSelectedNode(prev => prev?.id === node.id ? null : node)
  setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
  setSplashNode(prev =>
    node.content.trim() ? (prev?.id === node.id ? null : node) : null
  )
}
```

`NodeSplash` rendered conditionally at the end of `.graph-page`:

```tsx
{splashNode && (
  <NodeSplash
    node={splashNode}
    color={nodeColors[splashNode.type] ?? 'var(--text-dim)'}
    onClose={() => setSplashNode(null)}
  />
)}
```

## Tests

**`NodeSplash.test.tsx`:**
- Renders type, title, overview, and markdown content
- Does not render overview when empty
- Calls `onClose` when backdrop is clicked
- Does not call `onClose` when card interior is clicked
- Calls `onClose` when Escape is pressed
- Does not call `onClose` on other key presses

**`GraphPage.test.tsx` additions:**
- Splash opens when clicking a node with content
- Splash does not open when clicking a node with empty content
- Clicking the same node again closes the splash (toggle)
- `selectedNode` and `visibleIds` still update regardless of content

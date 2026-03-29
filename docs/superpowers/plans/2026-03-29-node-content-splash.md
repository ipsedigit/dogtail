# Node Content Splash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display a centered modal overlay with a node's full content when the user clicks a node with non-empty `content`.

**Architecture:** Add `splashNode` state to `GraphPage` alongside `selectedNode`. On node click, if `node.content.trim()` is non-empty, set `splashNode` (toggle on same node). Render a new `NodeSplash` component conditionally — a fixed backdrop with blur + a centered scrollable card. Existing graph expansion and panel behavior are unchanged.

**Tech Stack:** React, TypeScript, vitest, @testing-library/react, marked (already a dependency)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/styles/app.css` | Add `.node-splash-*` CSS classes |
| Create | `src/components/NodeSplash.tsx` | Backdrop + card modal component |
| Create | `src/components/NodeSplash.test.tsx` | Unit tests for NodeSplash |
| Modify | `src/pages/GraphPage.tsx` | Add `splashNode` state, update click handler, render NodeSplash |
| Modify | `src/pages/GraphPage.test.tsx` | Integration tests for splash open/close/toggle |

---

## Task 1: Add node-splash CSS

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Append splash classes to `app.css`**

Add at the end of `src/styles/app.css`:

```css
/* ── Node splash ── */
.node-splash-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(13,17,23,0.75);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}

.node-splash-card {
  background: #161b22;
  border: 1px solid #484f58;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  width: 90%; max-width: 640px; max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
  position: relative;
  font-family: var(--mono);
}

.node-splash-close {
  position: absolute; top: 12px; right: 14px;
  background: none; border: none; cursor: pointer;
  font-family: var(--mono); font-size: 11px; color: var(--text-dim);
  padding: 3px 6px; border-radius: 3px;
}
.node-splash-close:hover { background: var(--surface); color: var(--text); }

.node-splash-type {
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.node-splash-title {
  font-size: 22px; font-weight: 700;
  color: var(--text); margin-bottom: 8px; line-height: 1.2;
}

.node-splash-accent {
  height: 1px; margin-bottom: 12px;
}

.node-splash-overview {
  font-size: 12px; font-style: italic;
  color: var(--text-muted); margin-bottom: 14px; line-height: 1.5;
}

.node-splash-content { font-size: 13px; color: var(--text); line-height: 1.8; }
.node-splash-content h1,
.node-splash-content h2,
.node-splash-content h3 { font-size: 14px; color: var(--text); margin: 14px 0 4px; font-weight: 700; }
.node-splash-content p  { margin-bottom: 10px; }
.node-splash-content ul,
.node-splash-content ol { padding-left: 18px; margin-bottom: 8px; }
.node-splash-content li { margin-bottom: 3px; }
.node-splash-content code { background: var(--surface); padding: 1px 4px; border-radius: 3px; font-size: 12px; }
.node-splash-content pre { background: var(--surface); border: 1px solid var(--border-dim); padding: 12px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px; }
.node-splash-content pre code { background: none; padding: 0; }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/app.css
git commit -m "style: add node-splash CSS classes"
```

---

## Task 2: NodeSplash component (TDD)

**Files:**
- Create: `src/components/NodeSplash.test.tsx`
- Create: `src/components/NodeSplash.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/NodeSplash.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NodeSplash from './NodeSplash'
import type { GraphNode } from '../types'

const node: GraphNode = {
  id: 'tool-use',
  type: 'concept',
  title: 'Tool Use',
  overview: 'How models call external functions',
  content: '## Details\n\nTool use bridges language and action.',
  mtime: 0,
}

describe('NodeSplash', () => {
  it('renders type, title, overview, and markdown content', () => {
    render(<NodeSplash node={node} color="#7c3aed" onClose={vi.fn()} />)
    expect(screen.getByText(/CONCEPT/i)).toBeInTheDocument()
    expect(screen.getByText('Tool Use')).toBeInTheDocument()
    expect(screen.getByText(/How models call external functions/i)).toBeInTheDocument()
    expect(screen.getByText(/bridges language and action/i)).toBeInTheDocument()
  })

  it('does not render overview element when overview is empty', () => {
    const { container } = render(
      <NodeSplash node={{ ...node, overview: '' }} color="#7c3aed" onClose={vi.fn()} />
    )
    expect(container.querySelector('.node-splash-overview')).toBeNull()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.click(container.querySelector('.node-splash-backdrop')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when card interior is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.click(container.querySelector('.node-splash-card')!)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.click(screen.getByText(/close/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for other key presses', () => {
    const onClose = vi.fn()
    render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/components/NodeSplash.test.tsx
```

Expected: FAIL — `Cannot find module './NodeSplash'`

- [ ] **Step 3: Implement NodeSplash**

Create `src/components/NodeSplash.tsx`:

```tsx
import { useEffect } from 'react'
import { marked } from 'marked'
import type { GraphNode } from '../types'

interface Props {
  node: GraphNode
  color: string
  onClose: () => void
}

export default function NodeSplash({ node, color, onClose }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const html = marked.parse(node.content) as string

  return (
    <div className="node-splash-backdrop" onClick={onClose}>
      <div className="node-splash-card" onClick={e => e.stopPropagation()}>
        <button className="node-splash-close" onClick={onClose}>✕ close</button>
        <div className="node-splash-type" style={{ color }}>● {node.type.toUpperCase()}</div>
        <div className="node-splash-title">{node.title}</div>
        <div
          className="node-splash-accent"
          style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
        />
        {node.overview && (
          <div className="node-splash-overview">{node.overview}</div>
        )}
        <div
          className="node-splash-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/components/NodeSplash.test.tsx
```

Expected: all 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/NodeSplash.tsx src/components/NodeSplash.test.tsx
git commit -m "feat: add NodeSplash component"
```

---

## Task 3: GraphPage integration (TDD)

**Files:**
- Modify: `src/pages/GraphPage.test.tsx`
- Modify: `src/pages/GraphPage.tsx`

- [ ] **Step 1: Write failing tests**

Update the existing `@testing-library/react` import at the top of `src/pages/GraphPage.test.tsx` to include `fireEvent`:

```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
```

Add a new `vi.mock` block after the existing imports in the file (before the `const kb` declaration):

```tsx
vi.mock('../components/GraphCanvas', () => ({
  default: ({ onNodeClick, graphData }: { onNodeClick: (n: any) => void; graphData: any }) => (
    <div>
      {graphData.nodes.map((n: any) => (
        <button key={n.id} data-testid={`node-${n.id}`} onClick={() => onNodeClick(n)}>
          {n.title}
        </button>
      ))}
    </div>
  ),
}))
```

Add a new `describe` block at the end of `src/pages/GraphPage.test.tsx`:

```tsx
describe('GraphPage — node splash', () => {
  const kbSplash: KbMeta = { slug: 'splash-kb', title: 'Splash KB', overview: '', nodeCount: 2, updatedAt: 0 }

  const graphDataWithContent: GraphData = {
    nodes: [
      { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
      { id: 'child', type: 'concept', title: 'Child', overview: 'An overview', content: '## Body\n\nSome text.', mtime: 0 },
    ],
    edges: [],
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(graphDataWithContent),
    }))
  })

  it('opens splash when clicking a node with content', async () => {
    render(<GraphPage kb={kbSplash} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-child'))
    fireEvent.click(screen.getByTestId('node-child'))
    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(document.querySelector('.node-splash-backdrop')).not.toBeNull()
  })

  it('does not open splash when clicking a node with empty content', async () => {
    render(<GraphPage kb={kbSplash} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-root'))
    fireEvent.click(screen.getByTestId('node-root'))
    expect(document.querySelector('.node-splash-backdrop')).toBeNull()
  })

  it('closes splash when clicking same node again', async () => {
    render(<GraphPage kb={kbSplash} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-child'))
    fireEvent.click(screen.getByTestId('node-child'))
    expect(document.querySelector('.node-splash-backdrop')).not.toBeNull()
    fireEvent.click(screen.getByTestId('node-child'))
    expect(document.querySelector('.node-splash-backdrop')).toBeNull()
  })

  it('panel still receives selectedNode regardless of content', async () => {
    render(<GraphPage kb={kbSplash} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-root'))
    fireEvent.click(screen.getByTestId('node-root'))
    // Panel shows node detail — panel-detail appears when selectedNode is set.
    // Root has no content so no splash, but panel should still update.
    expect(document.querySelector('.panel-detail')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — confirm new tests fail**

```bash
npx vitest run src/pages/GraphPage.test.tsx
```

Expected: the 4 new splash tests FAIL, existing tests still PASS

- [ ] **Step 3: Update GraphPage**

In `src/pages/GraphPage.tsx`, make the following changes:

**Add import** (after existing imports):
```tsx
import NodeSplash from '../components/NodeSplash'
```

**Add state** (inside `GraphPage`, after the `selectedNode` line):
```tsx
const [splashNode, setSplashNode] = useState<GraphNode | null>(null)
```

**Replace `handleNodeClick`:**
```tsx
function handleNodeClick(node: GraphNode) {
  setSelectedNode(prev => prev?.id === node.id ? null : node)
  setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
  setSplashNode(prev =>
    node.content.trim() ? (prev?.id === node.id ? null : node) : null
  )
}
```

**Add `NodeSplash` render** (just before the closing `</div>` of `.graph-page`, after the `</div>` that closes `.graph-body`):
```tsx
{splashNode && (
  <NodeSplash
    node={splashNode}
    color={nodeColors[splashNode.type] ?? 'var(--text-dim)'}
    onClose={() => setSplashNode(null)}
  />
)}
```

The full updated `GraphPage.tsx` for reference:

```tsx
import { useState, useEffect, useMemo } from 'react'
import type { KbMeta, GraphData, GraphNode } from '../types'
import { NODE_TYPE_PALETTE, EDGE_TYPE_PALETTE } from '../constants'
import GraphCanvas from '../components/GraphCanvas'
import Panel from '../components/Panel'
import NodeSplash from '../components/NodeSplash'

function assignColors(values: string[], palette: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((v, i) => [v, palette[i % palette.length]]))
}

export function expandVisibleIds(
  graphData: GraphData,
  prev: Set<string>,
  nodeId: string
): Set<string> {
  const targets = graphData.edges
    .filter(e => e.source === nodeId)
    .map(e => e.target)
  return new Set([...prev, nodeId, ...targets])
}

interface Props {
  kb: KbMeta
  onBack: () => void
}

export default function GraphPage({ kb, onBack }: Props) {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [splashNode, setSplashNode] = useState<GraphNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/graph/${kb.slug}.json`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: GraphData) => {
        setGraphData(data)
        const bb = data.nodes.find(n => n.type === 'bigbang') ?? data.nodes[0]
        if (bb) setVisibleIds(new Set([bb.id]))
      })
      .catch(() => setError(`Could not load graph/${kb.slug}.json`))
  }, [kb.slug])

  const nodeColors = useMemo(() => {
    if (!graphData) return {}
    const types = [...new Set(graphData.nodes.map(n => n.type))]
    return assignColors(types, NODE_TYPE_PALETTE)
  }, [graphData])

  const edgeColors = useMemo(() => {
    if (!graphData) return {}
    const types = [...new Set(graphData.edges.map(e => e.type))]
    return assignColors(types, EDGE_TYPE_PALETTE)
  }, [graphData])

  function handleNodeClick(node: GraphNode) {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
    setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
    setSplashNode(prev =>
      node.content.trim() ? (prev?.id === node.id ? null : node) : null
    )
  }

  if (error) return <div className="error-screen">{error}</div>
  if (!graphData || visibleIds.size === 0) return <div className="loading-screen">Loading...</div>

  return (
    <div className="graph-page">
      <header className="graph-header">
        <button className="back-btn" onClick={onBack}>⌂ home</button>
        <span className="graph-title">{kb.title}</span>
        <div className="graph-controls">
          <span className="ctrl-placeholder">[ search ]</span>
          <span className="ctrl-placeholder">[ filter ]</span>
          <span className="ctrl-placeholder">[ export ]</span>
        </div>
      </header>
      <div className="graph-body">
        <GraphCanvas
          graphData={graphData}
          visibleIds={visibleIds}
          selectedNodeId={selectedNode?.id ?? null}
          onNodeClick={handleNodeClick}
          nodeColors={nodeColors}
          edgeColors={edgeColors}
        />
        <Panel
          kb={kb}
          graphData={graphData}
          selectedNode={selectedNode}
          edgeColors={edgeColors}
          nodeColors={nodeColors}
        />
      </div>
      {splashNode && (
        <NodeSplash
          node={splashNode}
          color={nodeColors[splashNode.type] ?? 'var(--text-dim)'}
          onClose={() => setSplashNode(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run all tests — confirm everything passes**

```bash
npx vitest run
```

Expected: all tests PASS including the 4 new splash integration tests

- [ ] **Step 5: Commit**

```bash
git add src/pages/GraphPage.tsx src/pages/GraphPage.test.tsx
git commit -m "feat: open node content splash on node click"
```

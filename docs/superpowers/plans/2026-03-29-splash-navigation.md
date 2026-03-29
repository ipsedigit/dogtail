# Splash Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add back/forward history and connected-neighbor chips to the NodeSplash component so users can navigate the graph without closing the splash.

**Architecture:** All history state lives in GraphPage (`splashHistory` array + `splashIndex`). NodeSplash remains a presentational component that receives neighbors and nav callbacks as optional props. Every navigation step syncs `selectedNode` and `visibleIds` on the main graph.

**Tech Stack:** React 18, TypeScript, Vitest, @testing-library/react

---

## File Map

| File | Change |
|---|---|
| `src/components/NodeSplash.tsx` | Add optional nav props, back/fwd buttons, Connected chips section |
| `src/components/NodeSplash.test.tsx` | Add 7 new tests for nav UI |
| `src/pages/GraphPage.tsx` | Replace `splashNode` with `splashHistory`/`splashIndex`, add helpers, add `splashNeighbors` memo, pass new props |
| `src/pages/GraphPage.test.tsx` | Add 5 new tests for history navigation |
| `src/styles/app.css` | Add `.node-splash-nav`, `.node-splash-chip`, `.node-splash-connected`, `.node-splash-connected-label`, `.node-splash-header` |

---

## Task 1: Extend NodeSplash with navigation UI

**Files:**
- Modify: `src/components/NodeSplash.tsx`
- Modify: `src/components/NodeSplash.test.tsx`

- [ ] **Step 1: Add failing tests for navigation UI**

Append to `src/components/NodeSplash.test.tsx` after the existing `describe` block:

```tsx
describe('NodeSplash — navigation', () => {
  const neighbor: GraphNode = {
    id: 'agent-loop',
    type: 'concept',
    title: 'Agent Loop',
    overview: '',
    content: '',
    mtime: 0,
  }

  it('back button is disabled when canGoBack is false', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        canGoBack={false} canGoForward={false}
        neighbors={[]} onNavigate={vi.fn()} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    expect(screen.getByText(/← back/i)).toBeDisabled()
  })

  it('back button calls onBack when canGoBack is true', () => {
    const onBack = vi.fn()
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        canGoBack={true} canGoForward={false}
        neighbors={[]} onNavigate={vi.fn()} onBack={onBack} onForward={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText(/← back/i))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('forward button is disabled when canGoForward is false', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        canGoBack={false} canGoForward={false}
        neighbors={[]} onNavigate={vi.fn()} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    expect(screen.getByText(/→ fwd/i)).toBeDisabled()
  })

  it('forward button calls onForward when canGoForward is true', () => {
    const onForward = vi.fn()
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        canGoBack={false} canGoForward={true}
        neighbors={[]} onNavigate={vi.fn()} onBack={vi.fn()} onForward={onForward}
      />
    )
    fireEvent.click(screen.getByText(/→ fwd/i))
    expect(onForward).toHaveBeenCalledTimes(1)
  })

  it('renders Connected section when neighbors are provided', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        neighbors={[{ node: neighbor, edgeLabel: 'links', color: '#d2a8ff' }]}
        onNavigate={vi.fn()} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    expect(screen.getByText(/connected/i)).toBeInTheDocument()
    expect(screen.getByText(/Agent Loop/i)).toBeInTheDocument()
  })

  it('does not render Connected section when neighbors is empty', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        neighbors={[]} onNavigate={vi.fn()} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    expect(screen.queryByText(/connected/i)).toBeNull()
  })

  it('clicking a neighbor chip calls onNavigate with the correct node', () => {
    const onNavigate = vi.fn()
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        neighbors={[{ node: neighbor, edgeLabel: 'links', color: '#d2a8ff' }]}
        onNavigate={onNavigate} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText(/Agent Loop/i))
    expect(onNavigate).toHaveBeenCalledWith(neighbor)
  })
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```bash
cd C:/repo/dogtail && npx vitest run src/components/NodeSplash.test.tsx
```

Expected: existing tests pass, all 7 new tests fail with errors like "Unable to find an element with the text: /← back/i".

- [ ] **Step 3: Replace NodeSplash.tsx with the updated implementation**

Full replacement of `src/components/NodeSplash.tsx`:

```tsx
import { useEffect, useMemo } from 'react'
import { marked } from 'marked'
import type { GraphNode } from '../types'

interface NeighborEntry {
  node: GraphNode
  edgeLabel: string
  color: string
}

interface Props {
  node: GraphNode
  color: string
  neighbors?: NeighborEntry[]
  canGoBack?: boolean
  canGoForward?: boolean
  onClose: () => void
  onNavigate?: (node: GraphNode) => void
  onBack?: () => void
  onForward?: () => void
}

export default function NodeSplash({
  node,
  color,
  neighbors = [],
  canGoBack = false,
  canGoForward = false,
  onClose,
  onNavigate,
  onBack,
  onForward,
}: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const html = useMemo(() => marked.parse(node.content) as string, [node.content])

  return (
    <div className="node-splash-backdrop" onClick={onClose}>
      <div className="node-splash-card" onClick={e => e.stopPropagation()}>
        <div className="node-splash-header">
          <div className="node-splash-nav">
            <button disabled={!canGoBack} onClick={onBack}>← back</button>
            <button disabled={!canGoForward} onClick={onForward}>→ fwd</button>
          </div>
          <button className="node-splash-close" onClick={onClose}>✕ close</button>
        </div>
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
        {neighbors.length > 0 && (
          <div className="node-splash-connected">
            <div className="node-splash-connected-label">Connected</div>
            <div className="node-splash-connected-chips">
              {neighbors.map(n => (
                <button
                  key={n.node.id}
                  className="node-splash-chip"
                  style={{ color: n.color }}
                  onClick={() => onNavigate?.(n.node)}
                >
                  ● {n.node.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run all NodeSplash tests**

```bash
cd C:/repo/dogtail && npx vitest run src/components/NodeSplash.test.tsx
```

Expected: all 14 tests pass (7 existing + 7 new).

- [ ] **Step 5: Commit**

```bash
cd C:/repo/dogtail && git add src/components/NodeSplash.tsx src/components/NodeSplash.test.tsx
git commit -m "feat: add navigation props and connected chips to NodeSplash"
```

---

## Task 2: Update GraphPage with history state and navigation helpers

**Files:**
- Modify: `src/pages/GraphPage.tsx`
- Modify: `src/pages/GraphPage.test.tsx`

- [ ] **Step 1: Add failing GraphPage navigation tests**

Add a new `describe` block at the end of `src/pages/GraphPage.test.tsx`:

```tsx
describe('GraphPage — splash navigation', () => {
  const kbNav: KbMeta = { slug: 'nav-kb', title: 'Nav KB', overview: '', nodeCount: 3, updatedAt: 0 }

  const graphDataNav: GraphData = {
    nodes: [
      { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
      { id: 'alpha', type: 'concept', title: 'Alpha', overview: '', content: '## Alpha', mtime: 0 },
      { id: 'beta', type: 'concept', title: 'Beta', overview: '', content: '## Beta', mtime: 0 },
    ],
    edges: [
      { id: 'alpha-beta', source: 'alpha', target: 'beta', type: 'links', label: 'links' },
    ],
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(graphDataNav),
    }))
  })

  it('shows Beta as a neighbor chip when Alpha splash is open', async () => {
    render(<GraphPage kb={kbNav} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByTestId('node-alpha'))
    expect(screen.getByText(/● Beta/i)).toBeInTheDocument()
  })

  it('navigating to a neighbor updates the splash to show that node', async () => {
    render(<GraphPage kb={kbNav} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByText(/● Beta/i))
    expect(screen.getAllByText('Beta').length).toBeGreaterThan(0)
    // back button should now be enabled
    expect(screen.getByText(/← back/i)).not.toBeDisabled()
  })

  it('splashBack returns to the previous node', async () => {
    render(<GraphPage kb={kbNav} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByText(/● Beta/i))
    fireEvent.click(screen.getByText(/← back/i))
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0)
    expect(screen.getByText(/→ fwd/i)).not.toBeDisabled()
  })

  it('splashForward re-navigates after going back', async () => {
    render(<GraphPage kb={kbNav} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByText(/● Beta/i))
    fireEvent.click(screen.getByText(/← back/i))
    fireEvent.click(screen.getByText(/→ fwd/i))
    expect(screen.getAllByText('Beta').length).toBeGreaterThan(0)
  })

  it('opening a splash from the canvas resets forward history', async () => {
    render(<GraphPage kb={kbNav} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-alpha'))
    // alpha → beta → back, then click alpha on canvas again
    fireEvent.click(screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByText(/● Beta/i))
    fireEvent.click(screen.getByText(/← back/i))
    // re-open alpha from canvas: forward history should be gone
    fireEvent.click(screen.getByTestId('node-alpha'))
    expect(screen.getByText(/→ fwd/i)).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

```bash
cd C:/repo/dogtail && npx vitest run src/pages/GraphPage.test.tsx
```

Expected: existing tests pass, the 5 new navigation tests fail.

- [ ] **Step 3: Replace GraphPage.tsx with updated implementation**

Full replacement of `src/pages/GraphPage.tsx`:

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
  const [splashHistory, setSplashHistory] = useState<GraphNode[]>([])
  const [splashIndex, setSplashIndex] = useState<number>(-1)
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

  const splashNode = splashHistory[splashIndex] ?? null
  const canGoBack = splashIndex > 0
  const canGoForward = splashIndex < splashHistory.length - 1

  const splashNeighbors = useMemo(() => {
    if (!graphData || !splashNode) return []
    const seen = new Set<string>()
    const result: { node: GraphNode; edgeLabel: string; color: string }[] = []
    for (const edge of graphData.edges) {
      let neighborId: string | null = null
      const label = edge.label
      if (edge.source === splashNode.id) neighborId = edge.target
      else if (edge.target === splashNode.id) neighborId = edge.source
      if (!neighborId || seen.has(neighborId)) continue
      seen.add(neighborId)
      const neighbor = graphData.nodes.find(n => n.id === neighborId)
      if (neighbor) result.push({ node: neighbor, edgeLabel: label, color: nodeColors[neighbor.type] ?? 'var(--text-dim)' })
    }
    return result
  }, [graphData, splashNode, nodeColors])

  function navigateSplash(node: GraphNode) {
    setSplashHistory(prev => [...prev.slice(0, splashIndex + 1), node])
    setSplashIndex(splashIndex + 1)
    setSelectedNode(node)
    setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
  }

  function splashBack() {
    const newIndex = splashIndex - 1
    const node = splashHistory[newIndex]
    setSplashIndex(newIndex)
    setSelectedNode(node)
    setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
  }

  function splashForward() {
    const newIndex = splashIndex + 1
    const node = splashHistory[newIndex]
    setSplashIndex(newIndex)
    setSelectedNode(node)
    setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
  }

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
          neighbors={splashNeighbors}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onClose={() => { setSplashHistory([]); setSplashIndex(-1) }}
          onNavigate={navigateSplash}
          onBack={splashBack}
          onForward={splashForward}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run all GraphPage tests**

```bash
cd C:/repo/dogtail && npx vitest run src/pages/GraphPage.test.tsx
```

Expected: all tests pass (existing + 5 new navigation tests).

- [ ] **Step 5: Run the full test suite**

```bash
cd C:/repo/dogtail && npx vitest run
```

Expected: all tests pass across all files.

- [ ] **Step 6: Commit**

```bash
cd C:/repo/dogtail && git add src/pages/GraphPage.tsx src/pages/GraphPage.test.tsx
git commit -m "feat: add splash navigation history to GraphPage"
```

---

## Task 3: CSS for navigation elements

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Add navigation CSS classes**

Append to the end of the `.node-splash-*` block in `src/styles/app.css` (after line 196):

```css
.node-splash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.node-splash-nav { display: flex; gap: 6px; }
.node-splash-nav button {
  background: var(--surface);
  border: 1px solid var(--border-dim);
  border-radius: 4px;
  color: var(--text);
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
}
.node-splash-nav button:disabled { opacity: 0.3; cursor: default; }
.node-splash-nav button:not(:disabled):hover { background: var(--surface-raised, #21262d); }
.node-splash-connected { margin-top: 20px; border-top: 1px solid var(--border-dim); padding-top: 16px; }
.node-splash-connected-label {
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 10px;
}
.node-splash-connected-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.node-splash-chip {
  background: var(--surface);
  border: 1px solid var(--border-dim);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
}
.node-splash-chip:hover { background: var(--surface-raised, #21262d); }
```

- [ ] **Step 2: Verify tests still pass after CSS addition**

```bash
cd C:/repo/dogtail && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
cd C:/repo/dogtail && git add src/styles/app.css
git commit -m "style: add node-splash navigation and connected chips CSS"
```

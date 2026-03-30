# Graph Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove in-splash history navigation (back/forward) and make neighbor chip clicks delegate to `handleNodeClick`, so the splash is a simple content viewer with adjacent-node shortcuts.

**Architecture:** `GraphPage` reverts to a single `splashNode: GraphNode | null` state variable. `NodeSplash` loses `canGoBack`, `canGoForward`, `onBack`, `onForward` props and the nav button row. Chip clicks call `onNavigate` which is wired to `handleNodeClick` in `GraphPage` — identical to clicking the node directly in the graph.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library

---

### Task 1: Update NodeSplash tests

**Files:**
- Modify: `src/components/NodeSplash.test.tsx`

- [ ] **Step 1: Replace the navigation describe block**

Delete the entire `describe('NodeSplash — navigation', ...)` block (lines 67–159) and replace it with a trimmed version that removes back/forward tests but keeps the Connected section and chip tests:

```tsx
describe('NodeSplash — neighbors', () => {
  const neighbor: GraphNode = {
    id: 'agent-loop',
    type: 'concept',
    title: 'Agent Loop',
    overview: '',
    content: '',
    mtime: 0,
  }

  it('renders Connected section when neighbors are provided', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        neighbors={[{ node: neighbor, edgeLabel: 'links', color: '#d2a8ff' }]}
        onNavigate={vi.fn()}
      />
    )
    expect(screen.getByText(/connected/i)).toBeInTheDocument()
    expect(screen.getByText(/Agent Loop/i)).toBeInTheDocument()
  })

  it('does not render Connected section when neighbors is empty', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        neighbors={[]}
        onNavigate={vi.fn()}
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
        onNavigate={onNavigate}
      />
    )
    fireEvent.click(screen.getByText(/Agent Loop/i))
    expect(onNavigate).toHaveBeenCalledWith(neighbor)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail (back/forward buttons still exist in component)**

```bash
cd C:/repo/dogtail && npx vitest run src/components/NodeSplash.test.tsx
```

Expected: some tests PASS (neighbors tests may pass or fail depending on prop types), but overall the test file should run cleanly — verify there are no import errors and the new tests at minimum compile.

> Note: TypeScript may complain if `onBack`/`onForward` are still required props in the component. That's expected — it gets fixed in Task 2.

---

### Task 2: Simplify NodeSplash component and CSS

**Files:**
- Modify: `src/components/NodeSplash.tsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Replace the Props interface and component**

Replace the full content of `src/components/NodeSplash.tsx` with:

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
  onClose: () => void
  onNavigate?: (node: GraphNode) => void
}

export default function NodeSplash({
  node,
  color,
  neighbors = [],
  onClose,
  onNavigate,
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

- [ ] **Step 2: Remove `.node-splash-nav` CSS rules from `src/styles/app.css`**

Delete these four lines (they are consecutive):

```css
.node-splash-nav { display: flex; gap: 6px; }
.node-splash-nav button {
```

Specifically, remove the entire `.node-splash-nav` block. The lines to remove are (search for `.node-splash-nav`):

```
.node-splash-nav { display: flex; gap: 6px; }
.node-splash-nav button {
  background: none; border: 1px solid var(--border-dim); color: var(--text-dim);
  border-radius: 4px; padding: 2px 8px; font-size: 0.8em; cursor: pointer;
}
.node-splash-nav button:disabled { opacity: 0.3; cursor: default; }
.node-splash-nav button:not(:disabled):hover { background: var(--surface-raised, #21262d); }
```

Leave `.node-splash-connected` and all rules below it untouched.

- [ ] **Step 3: Run NodeSplash tests**

```bash
cd C:/repo/dogtail && npx vitest run src/components/NodeSplash.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd C:/repo/dogtail
git add src/components/NodeSplash.tsx src/components/NodeSplash.test.tsx src/styles/app.css
git commit -m "refactor: remove back/forward nav from NodeSplash, chip click delegates to onNavigate"
```

---

### Task 3: Update GraphPage tests

**Files:**
- Modify: `src/pages/GraphPage.test.tsx`

- [ ] **Step 1: Remove the splash navigation describe block**

Delete the entire `describe('GraphPage — splash navigation', ...)` block (lines 125–194). This removes tests for `navigateSplash`, `splashBack`, `splashForward`, back/forward buttons.

- [ ] **Step 2: Add new chip-delegation tests**

Append the following describe block at the end of the file. It uses a graph where `alpha` connects to `beta` (has content) and `gamma` (no content):

```tsx
describe('GraphPage — chip click delegates to handleNodeClick', () => {
  const kbChip: KbMeta = { slug: 'chip-kb', title: 'Chip KB', overview: '', nodeCount: 3, updatedAt: 0 }

  const graphDataChip: GraphData = {
    nodes: [
      { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
      { id: 'alpha', type: 'concept', title: 'Alpha', overview: '', content: '## Alpha', mtime: 0 },
      { id: 'beta', type: 'concept', title: 'Beta', overview: '', content: '## Beta', mtime: 0 },
      { id: 'gamma', type: 'concept', title: 'Gamma', overview: '', content: '', mtime: 0 },
    ],
    edges: [
      { id: 'alpha-beta', source: 'alpha', target: 'beta', type: 'links', label: 'links' },
      { id: 'alpha-gamma', source: 'alpha', target: 'gamma', type: 'links', label: 'links' },
    ],
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(graphDataChip),
    }))
  })

  it('clicking a neighbor chip with content opens the splash for that neighbor', async () => {
    render(<GraphPage kb={kbChip} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByText(/● Beta/i))
    expect(document.querySelector('.node-splash-backdrop')).not.toBeNull()
    expect(screen.getAllByText('Beta').length).toBeGreaterThan(0)
  })

  it('clicking a neighbor chip without content closes the splash', async () => {
    render(<GraphPage kb={kbChip} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByText(/● Gamma/i))
    expect(document.querySelector('.node-splash-backdrop')).toBeNull()
  })

  it('no back/forward buttons exist in the splash', async () => {
    render(<GraphPage kb={kbChip} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-alpha'))
    fireEvent.click(screen.getByTestId('node-alpha'))
    expect(screen.queryByText(/← back/i)).toBeNull()
    expect(screen.queryByText(/→ fwd/i)).toBeNull()
  })
})
```

- [ ] **Step 3: Run GraphPage tests to verify new tests fail**

```bash
cd C:/repo/dogtail && npx vitest run src/pages/GraphPage.test.tsx
```

Expected: the three new chip-delegation tests FAIL (GraphPage still uses the old history model that keeps the splash open on chip click, not switching splashes). The existing splash tests should still pass.

---

### Task 4: Simplify GraphPage

**Files:**
- Modify: `src/pages/GraphPage.tsx`

- [ ] **Step 1: Replace state and handlers**

In `src/pages/GraphPage.tsx`, make the following changes:

**Remove** these two state lines (lines 32–33):
```ts
const [splashHistory, setSplashHistory] = useState<GraphNode[]>([])
const [splashIndex, setSplashIndex] = useState<number>(-1)
```

**Add** in their place:
```ts
const [splashNode, setSplashNode] = useState<GraphNode | null>(null)
```

**Remove** the derived values (lines 59–61):
```ts
const splashNode = splashHistory[splashIndex] ?? null
const canGoBack = splashIndex > 0
const canGoForward = splashIndex < splashHistory.length - 1
```

**Remove** the three helper functions `navigateSplash`, `splashBack`, `splashForward` (lines 80–101).

**Replace** `handleNodeClick` (lines 103–122) with:
```ts
function handleNodeClick(node: GraphNode) {
  setSelectedNode(prev => prev?.id === node.id ? null : node)
  setVisibleIds(prev => expandVisibleIds(graphData!, prev, node.id))
  setSplashNode(prev => node.content.trim() ? (prev?.id === node.id ? null : node) : null)
}
```

**Replace** the NodeSplash render block (lines 155–167) with:
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

- [ ] **Step 2: Run all tests**

```bash
cd C:/repo/dogtail && npx vitest run
```

Expected: all tests PASS. No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd C:/repo/dogtail
git add src/pages/GraphPage.tsx src/pages/GraphPage.test.tsx
git commit -m "refactor: simplify splash state, chip click delegates to handleNodeClick"
```

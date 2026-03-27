# Graph Cumulative Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking a node adds its outgoing connections to the visible graph (Neo4j-style cumulative expansion) instead of replacing the view with a 1-hop neighborhood.

**Architecture:** Two changes — (1) `GraphCanvas` replaces its `focusNodeId: string` prop with `visibleIds: Set<string>` and renames `getNeighborhood` → `getVisibleSubgraph` which filters by the set; (2) `GraphPage` replaces `focusNodeId` state with `visibleIds: Set<string>`, initialized with the bigbang node, and expands on click by adding outgoing targets.

**Tech Stack:** React, TypeScript, Vitest, `@testing-library/react`, `@xyflow/react`

---

## File Map

| File | Change |
|------|--------|
| `src/components/GraphCanvas.tsx` | Rename `getNeighborhood` → `getVisibleSubgraph`; change `focusNodeId` prop to `visibleIds`; update internal useMemos |
| `src/components/GraphCanvas.test.tsx` | Update render test prop; rename algorithm test to use `getVisibleSubgraph` |
| `src/pages/GraphPage.tsx` | Replace `focusNodeId` state with `visibleIds`; export `expandVisibleIds` helper; update `handleNodeClick` and render |
| `src/pages/GraphPage.test.tsx` | Add test for `expandVisibleIds` |

---

### Task 1: Replace `getNeighborhood` with `getVisibleSubgraph` in GraphCanvas

**Files:**
- Modify: `src/components/GraphCanvas.tsx`
- Modify: `src/components/GraphCanvas.test.tsx`

- [ ] **Step 1: Write failing tests**

Replace the entire contents of `src/components/GraphCanvas.test.tsx` with:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import GraphCanvas, { getVisibleSubgraph } from './GraphCanvas'
import type { GraphData } from '../types'

const graphData: GraphData = {
  nodes: [
    { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
    { id: 'child', type: 'concept', title: 'Child', overview: '', content: '', mtime: 0 },
  ],
  edges: [{ id: 'root-child-links', source: 'root', target: 'child', type: 'links', label: 'links' }],
}

describe('GraphCanvas', () => {
  it('renders a React Flow container', () => {
    render(
      <GraphCanvas
        graphData={graphData}
        visibleIds={new Set(['root', 'child'])}
        selectedNodeId={null}
        onNodeClick={vi.fn()}
        nodeColors={{ bigbang: '#7c3aed', concept: '#0ea5e9' }}
        edgeColors={{ links: '#e879f9' }}
      />
    )
    expect(document.querySelector('.react-flow')).toBeInTheDocument()
  })

  it('getVisibleSubgraph returns only nodes in the visible set', () => {
    const data: GraphData = {
      nodes: [
        { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
        { id: 'child', type: 'concept', title: 'Child', overview: '', content: '', mtime: 0 },
        { id: 'other', type: 'concept', title: 'Other', overview: '', content: '', mtime: 0 },
      ],
      edges: [
        { id: 'root-child', source: 'root', target: 'child', type: 'links', label: 'links' },
        { id: 'root-other', source: 'root', target: 'other', type: 'links', label: 'links' },
      ],
    }
    const { nodes, edges } = getVisibleSubgraph(data, new Set(['root', 'child']))
    const ids = nodes.map(n => n.id)
    expect(ids).toContain('root')
    expect(ids).toContain('child')
    expect(ids).not.toContain('other')
    // edge only appears when both endpoints are visible
    expect(edges.map(e => e.id)).toContain('root-child')
    expect(edges.map(e => e.id)).not.toContain('root-other')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/GraphCanvas.test.tsx
```

Expected: FAIL — `getVisibleSubgraph` not exported, `focusNodeId` prop no longer matches.

- [ ] **Step 3: Replace `GraphCanvas.tsx` with the updated implementation**

Replace the entire contents of `src/components/GraphCanvas.tsx` with:

```tsx
import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react'
import dagre from 'dagre'
import '@xyflow/react/dist/style.css'
import NodeCard from './NodeCard'
import type { GraphData, GraphNode } from '../types'

const NODE_W = 200
const NODE_H = 80

function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 60, nodesep: 40 })
  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map(n => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } }
  })
}

export function getVisibleSubgraph(graphData: GraphData, visibleIds: Set<string>) {
  const nodes = graphData.nodes.filter(n => visibleIds.has(n.id))
  const edges = graphData.edges.filter(e =>
    visibleIds.has(e.source) && visibleIds.has(e.target)
  )
  return { nodes, edges }
}

const nodeTypes = { default: NodeCard }

interface Props {
  graphData: GraphData
  visibleIds: Set<string>
  selectedNodeId: string | null
  onNodeClick: (node: GraphNode) => void
  nodeColors: Record<string, string>
  edgeColors: Record<string, string>
}

export default function GraphCanvas({
  graphData, visibleIds, selectedNodeId, onNodeClick, nodeColors, edgeColors,
}: Props) {
  const { nodes: visibleNodes, edges: visibleEdges } = useMemo(
    () => getVisibleSubgraph(graphData, visibleIds),
    [graphData, visibleIds]
  )

  const rawNodes: Node[] = useMemo(() => visibleNodes.map(n => ({
    id: n.id,
    type: 'default',
    position: { x: 0, y: 0 },
    data: { ...n, color: nodeColors[n.type] ?? '#6e7681' },
    selected: n.id === selectedNodeId,
  })), [visibleNodes, nodeColors, selectedNodeId])

  const rawEdges: Edge[] = useMemo(() => visibleEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: { stroke: edgeColors[e.type] ?? '#6e7681' },
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors[e.type] ?? '#6e7681' },
    labelStyle: { fill: edgeColors[e.type] ?? '#6e7681', fontSize: 9, fontFamily: 'monospace' },
    labelBgStyle: { fill: '#0d1117' },
  })), [visibleEdges, edgeColors])

  const laid = useMemo(() => layoutNodes(rawNodes, rawEdges), [rawNodes, rawEdges])
  const [nodes, setNodes, onNodesChange] = useNodesState(laid)
  const [edges, , onEdgesChange] = useEdgesState(rawEdges)

  useEffect(() => { setNodes(laid) }, [laid, setNodes])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => {
        const gn = graphData.nodes.find(n => n.id === node.id)
        if (gn) onNodeClick(gn)
      }}
      nodeTypes={nodeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#21262d" gap={24} />
      <Controls />
    </ReactFlow>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/GraphCanvas.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/GraphCanvas.tsx src/components/GraphCanvas.test.tsx
git commit -m "feat: replace getNeighborhood with getVisibleSubgraph in GraphCanvas"
```

---

### Task 2: Cumulative expansion state in GraphPage

**Files:**
- Modify: `src/pages/GraphPage.tsx`
- Modify: `src/pages/GraphPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this to `src/pages/GraphPage.test.tsx`, after the existing imports:

```ts
import { expandVisibleIds } from './GraphPage'
```

Then add inside the existing `describe('GraphPage', ...)` block:

```ts
it('expandVisibleIds adds the clicked node and its outgoing targets', () => {
  const data: GraphData = {
    nodes: [
      { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
      { id: 'child', type: 'concept', title: 'Child', overview: '', content: '', mtime: 0 },
      { id: 'other', type: 'concept', title: 'Other', overview: '', content: '', mtime: 0 },
    ],
    edges: [
      { id: 'root-child', source: 'root', target: 'child', type: 'links', label: 'links' },
      { id: 'root-other', source: 'root', target: 'other', type: 'links', label: 'links' },
    ],
  }
  const result = expandVisibleIds(data, new Set(['root']), 'root')
  expect(result.has('root')).toBe(true)
  expect(result.has('child')).toBe(true)
  expect(result.has('other')).toBe(true)
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/pages/GraphPage.test.tsx
```

Expected: FAIL — `expandVisibleIds` not exported.

- [ ] **Step 3: Replace `GraphPage.tsx` with the updated implementation**

Replace the entire contents of `src/pages/GraphPage.tsx` with:

```tsx
import { useState, useEffect, useMemo } from 'react'
import type { KbMeta, GraphData, GraphNode } from '../types'
import { NODE_TYPE_PALETTE, EDGE_TYPE_PALETTE } from '../constants'
import GraphCanvas from '../components/GraphCanvas'
import Panel from '../components/Panel'

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
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run all tests to confirm they pass**

```bash
npx vitest run src/pages/GraphPage.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/GraphPage.tsx src/pages/GraphPage.test.tsx
git commit -m "feat: cumulative graph expansion on node click"
```

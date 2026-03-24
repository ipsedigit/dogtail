# dogtail Initial Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build dogtail — a browser-based knowledge graph explorer with a TUI dark UI, React Flow canvas, and a Node.js build script that converts markdown files to a static graph.

**Architecture:** A Node.js build script walks `content/`, parses frontmatter, and writes `public/graph.json`. A React + Vite app loads this file at startup, renders an interactive React Flow canvas centered on the bigbang node, and shows a detail panel on the right.

**Tech Stack:** React 18, TypeScript, Vite, React Flow (`@xyflow/react`), `dagre` (DAG layout), `gray-matter`, `marked`, `tsx` (for running TypeScript scripts), Vitest, React Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `scripts/build-graph.ts` | Walk `content/`, parse frontmatter, emit `public/graph.json` |
| `src/types.ts` | TypeScript types: `GraphNode`, `GraphEdge`, `GraphData` |
| `src/constants.ts` | Fixed color palettes for node types and edge types |
| `src/App.tsx` | Fetch `graph.json`, manage selected node state, layout |
| `src/components/GraphCanvas.tsx` | React Flow canvas, neighborhood filtering, re-center logic |
| `src/components/NodeCard.tsx` | Custom React Flow node: type label, title, overview |
| `src/components/Panel.tsx` | Right panel: KB overview (default) or node detail (selected) |
| `src/styles/app.css` | TUI dark theme, dot-grid, node card styles, panel styles |

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`

- [ ] **Step 1: Initialise Vite + React + TypeScript project**

```bash
npm create vite@latest . -- --template react-ts
```

Expected: standard Vite scaffold created in current directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install @xyflow/react marked gray-matter dagre
npm install --save-dev tsx vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/dagre
```

- [ ] **Step 3: Add test and build-graph scripts to package.json**

Open `package.json` and add to `"scripts"`:

```json
"test": "vitest",
"test:run": "vitest run",
"build:graph": "tsx scripts/build-graph.ts",
"watch:graph": "tsx --watch scripts/build-graph.ts"
```

- [ ] **Step 4: Configure Vitest in vite.config.ts**

Replace `vite.config.ts` with:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 5: Create test setup file**

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Delete Vite boilerplate**

Delete: `src/App.css`, `src/assets/`, `public/vite.svg`, `src/App.tsx` (will be recreated).
Keep: `src/main.tsx`, `index.html`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/types.ts`
- Create: `src/types.test.ts`

- [ ] **Step 1: Write the test**

Create `src/types.test.ts`:

```typescript
import { describe, it, expectTypeOf } from 'vitest'
import type { GraphNode, GraphEdge, GraphData } from './types'

describe('GraphData types', () => {
  it('GraphNode has required fields', () => {
    expectTypeOf<GraphNode>().toHaveProperty('id')
    expectTypeOf<GraphNode>().toHaveProperty('type')
    expectTypeOf<GraphNode>().toHaveProperty('title')
    expectTypeOf<GraphNode>().toHaveProperty('overview')
    expectTypeOf<GraphNode>().toHaveProperty('content')
    expectTypeOf<GraphNode>().toHaveProperty('mtime')
  })

  it('GraphEdge has required fields', () => {
    expectTypeOf<GraphEdge>().toHaveProperty('id')
    expectTypeOf<GraphEdge>().toHaveProperty('source')
    expectTypeOf<GraphEdge>().toHaveProperty('target')
    expectTypeOf<GraphEdge>().toHaveProperty('type')
    expectTypeOf<GraphEdge>().toHaveProperty('label')
  })

  it('GraphData has nodes and edges', () => {
    expectTypeOf<GraphData>().toHaveProperty('nodes')
    expectTypeOf<GraphData>().toHaveProperty('edges')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/types.test.ts
```

Expected: FAIL — `types` module not found.

- [ ] **Step 3: Implement types**

Create `src/types.ts`:

```typescript
export interface GraphNode {
  id: string          // slug derived from title, e.g. "tool-use"
  type: string        // user-defined, e.g. "concept", "tool", "bigbang"
  title: string
  overview: string
  content: string     // full markdown body (without frontmatter)
  mtime: number       // file modification timestamp (ms)
}

export interface GraphEdge {
  id: string          // `${source}-${target}-${type}`
  source: string      // node id
  target: string      // node id
  type: string        // edge label used as type identifier
  label: string       // display text (same as type)
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/types.test.ts
git commit -m "feat: add GraphData TypeScript types"
```

---

## Task 3: Color palettes

**Files:**
- Create: `src/constants.ts`
- Create: `src/constants.test.ts`

- [ ] **Step 1: Write the tests**

Create `src/constants.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getNodeColor, getEdgeColor } from './constants'

describe('getNodeColor', () => {
  it('returns a color string for a known type', () => {
    const color = getNodeColor('concept')
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns the same color for the same type', () => {
    expect(getNodeColor('tool')).toBe(getNodeColor('tool'))
  })

  it('returns different colors for different types', () => {
    expect(getNodeColor('concept')).not.toBe(getNodeColor('tool'))
  })

  it('cycles palette for unknown types beyond palette length', () => {
    const types = ['a','b','c','d','e','f','g','h','i','j','k']
    const colors = types.map(getNodeColor)
    expect(colors[0]).toBe(colors[colors.length - 1]) // palette has cycled
  })
})

describe('getEdgeColor', () => {
  it('returns a color string for a known edge type', () => {
    expect(getEdgeColor('requires')).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns different colors from node palette', () => {
    expect(getEdgeColor('requires')).not.toBe(getNodeColor('requires'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/constants.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement constants**

Create `src/constants.ts`:

```typescript
const NODE_PALETTE = [
  '#7c3aed', // violet
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
]

const EDGE_PALETTE = [
  '#e879f9', // fuchsia
  '#34d399', // green
  '#fb923c', // orange
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#f472b6', // pink
  '#4ade80', // light green
  '#fbbf24', // yellow
]

const nodeColorMap = new Map<string, string>()
const edgeColorMap = new Map<string, string>()

export function getNodeColor(type: string): string {
  if (!nodeColorMap.has(type)) {
    nodeColorMap.set(type, NODE_PALETTE[nodeColorMap.size % NODE_PALETTE.length])
  }
  return nodeColorMap.get(type)!
}

export function getEdgeColor(type: string): string {
  if (!edgeColorMap.has(type)) {
    edgeColorMap.set(type, EDGE_PALETTE[edgeColorMap.size % EDGE_PALETTE.length])
  }
  return edgeColorMap.get(type)!
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/constants.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/constants.ts src/constants.test.ts
git commit -m "feat: add color palettes for node and edge types"
```

---

## Task 4: Build script

**Files:**
- Create: `scripts/build-graph.ts`
- Create: `scripts/build-graph.test.ts`
- Create: `content/bigbang.md` (sample file for tests)

- [ ] **Step 1: Create sample content files for testing**

Create `content/bigbang.md`:

```markdown
---
type: bigbang
title: Agentic Coding
overview: Learning and building with AI-assisted software development
---

The origin node of this knowledge base.
```

Create `content/tool-use.md`:

```markdown
---
type: concept
title: Tool Use
overview: Mechanism for calling external functions from an LLM
from:
  - source: "Agentic Coding"
    edge: "spawns"
---

Tool use allows language models to call external functions.
```

- [ ] **Step 2: Write the tests**

Create `scripts/build-graph.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseContentDir, slugify } from './build-graph'
import path from 'path'

const FIXTURES = path.resolve(__dirname, '../content')

describe('slugify', () => {
  it('converts title to lowercase kebab-case', () => {
    expect(slugify('Tool Use')).toBe('tool-use')
    expect(slugify('Claude Code')).toBe('claude-code')
  })
})

describe('parseContentDir', () => {
  it('returns nodes for each markdown file', async () => {
    const { nodes } = await parseContentDir(FIXTURES)
    expect(nodes.length).toBeGreaterThanOrEqual(2)
  })

  it('parses bigbang node correctly', async () => {
    const { nodes } = await parseContentDir(FIXTURES)
    const bigbang = nodes.find(n => n.type === 'bigbang')
    expect(bigbang).toBeDefined()
    expect(bigbang!.title).toBe('Agentic Coding')
    expect(bigbang!.overview).toBe('Learning and building with AI-assisted software development')
  })

  it('generates edges from from-frontmatter', async () => {
    const { edges } = await parseContentDir(FIXTURES)
    const edge = edges.find(e => e.label === 'spawns')
    expect(edge).toBeDefined()
    expect(edge!.source).toBe('agentic-coding')
    expect(edge!.target).toBe('tool-use')
  })

  it('node content contains markdown body without frontmatter', async () => {
    const { nodes } = await parseContentDir(FIXTURES)
    const node = nodes.find(n => n.id === 'tool-use')
    expect(node!.content).toContain('Tool use allows language models')
    expect(node!.content).not.toContain('type: concept')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run -- scripts/build-graph.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement build script**

Create `scripts/build-graph.ts`:

```typescript
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import type { GraphData, GraphNode, GraphEdge } from '../src/types'

const CONTENT_DIR = path.resolve(process.cwd(), 'content')
const OUTPUT_FILE = path.resolve(process.cwd(), 'public/graph.json')

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface FrontmatterFrom {
  source: string
  edge: string
}

interface Frontmatter {
  type: string
  title: string
  overview: string
  from?: FrontmatterFrom[]
}

export async function parseContentDir(dir: string): Promise<GraphData> {
  const files = await fs.readdir(dir)
  const mdFiles = files.filter(f => f.endsWith('.md'))

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (const file of mdFiles) {
    const filePath = path.join(dir, file)
    const raw = await fs.readFile(filePath, 'utf-8')
    const stat = await fs.stat(filePath)
    const { data, content } = matter(raw)
    const fm = data as Frontmatter

    const node: GraphNode = {
      id: slugify(fm.title),
      type: fm.type,
      title: fm.title,
      overview: fm.overview ?? '',
      content: content.trim(),
      mtime: stat.mtimeMs,
    }
    nodes.push(node)

    if (fm.from) {
      for (const incoming of fm.from) {
        const sourceId = slugify(incoming.source)
        const targetId = node.id
        edges.push({
          id: `${sourceId}-${targetId}-${incoming.edge}`,
          source: sourceId,
          target: targetId,
          type: incoming.edge,
          label: incoming.edge,
        })
      }
    }
  }

  return { nodes, edges }
}

async function main() {
  const data = await parseContentDir(CONTENT_DIR)
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2))
  console.log(`graph.json written: ${data.nodes.length} nodes, ${data.edges.length} edges`)
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- scripts/build-graph.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run the build script manually and verify output**

```bash
npm run build:graph
cat public/graph.json
```

Expected: valid JSON with at least 2 nodes and 1 edge.

- [ ] **Step 7: Commit**

```bash
git add scripts/ content/ public/graph.json
git commit -m "feat: add build script and sample content"
```

---

## Task 5: App shell + error state

**Files:**
- Create: `src/App.tsx`
- Create: `src/App.test.tsx`
- Modify: `src/main.tsx`
- Create: `src/styles/app.css`

- [ ] **Step 1: Write the tests**

Create `src/App.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Not found'))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/build script/i)).toBeInTheDocument()
    })
  })

  it('shows error state when graph.json is malformed', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ invalid: true }),
    } as Response)
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/build script/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/App.test.tsx
```

Expected: FAIL — `App` module not found.

- [ ] **Step 3: Create the global CSS**

Create `src/styles/app.css`:

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-canvas: #0d1117;
  --bg-node: #161b22;
  --bg-panel: #010409;
  --border: #21262d;
  --border-muted: #30363d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --font-mono: 'Courier New', Courier, monospace;
}

html, body, #root {
  height: 100%;
  background: var(--bg-canvas);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 36px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  flex-shrink: 0;
}

.app-header-title {
  font-weight: 600;
  color: var(--text-primary);
}

.app-header-actions {
  display: flex;
  gap: 12px;
  color: var(--text-muted);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--text-secondary);
}

.error-screen code {
  background: var(--bg-node);
  border: 1px solid var(--border-muted);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
```

- [ ] **Step 4: Implement App**

Create `src/App.tsx`:

```typescript
import { useEffect, useState } from 'react'
import type { GraphData, GraphNode } from './types'
import './styles/app.css'

function isValidGraphData(data: unknown): data is GraphData {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as GraphData).nodes) &&
    Array.isArray((data as GraphData).edges)
  )
}

export default function App() {
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [error, setError] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  useEffect(() => {
    fetch('/graph.json')
      .then(r => r.json())
      .then(data => {
        if (!isValidGraphData(data)) throw new Error('Invalid graph.json')
        setGraph(data)
      })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="error-screen">
        <p>Could not load graph data.</p>
        <p>Run the build script first:</p>
        <code>npm run build:graph</code>
      </div>
    )
  }

  if (!graph) {
    return <div className="error-screen"><p>Loading...</p></div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header-title">dogtail</span>
        <div className="app-header-actions">
          <span>⌕ search</span>
          <span>⊟ filter</span>
          <span onClick={() => setSelectedNode(null)}>⌂ home</span>
        </div>
      </header>
      <div className="app-body">
        <p style={{ color: 'var(--text-muted)', padding: 16 }}>
          Graph canvas coming in next task. Nodes: {graph.nodes.length}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update main.tsx to import CSS**

Open `src/main.tsx`, ensure it imports `App` and mounts to `#root`. Remove any Vite default CSS imports.

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm run test:run -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Smoke-test in browser**

```bash
npm run build:graph && npm run dev
```

Open `http://localhost:5173`. Expect: dark header with "dogtail", node count displayed.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: add app shell with loading and error states"
```

---

## Task 6: NodeCard component

**Files:**
- Create: `src/components/NodeCard.tsx`
- Create: `src/components/NodeCard.test.tsx`

- [ ] **Step 1: Write the tests**

Create `src/components/NodeCard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NodeCard } from './NodeCard'

const mockNode = {
  id: 'tool-use',
  type: 'concept',
  title: 'Tool Use',
  overview: 'Calling external functions from an LLM',
  content: '',
  mtime: 0,
}

describe('NodeCard', () => {
  it('renders the node type label', () => {
    render(<NodeCard node={mockNode} selected={false} onClick={() => {}} />)
    expect(screen.getByText(/concept/i)).toBeInTheDocument()
  })

  it('renders the node title', () => {
    render(<NodeCard node={mockNode} selected={false} onClick={() => {}} />)
    expect(screen.getByText('Tool Use')).toBeInTheDocument()
  })

  it('renders the node overview', () => {
    render(<NodeCard node={mockNode} selected={false} onClick={() => {}} />)
    expect(screen.getByText(/Calling external functions/i)).toBeInTheDocument()
  })

  it('applies selected style when selected', () => {
    const { container } = render(<NodeCard node={mockNode} selected={true} onClick={() => {}} />)
    expect(container.firstChild).toHaveClass('node-card--selected')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<NodeCard node={mockNode} selected={false} onClick={onClick} />)
    screen.getByText('Tool Use').click()
    expect(onClick).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/components/NodeCard.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement NodeCard**

Create `src/components/NodeCard.tsx`:

```typescript
import type { GraphNode } from '../types'
import { getNodeColor } from '../constants'

interface Props {
  node: GraphNode
  selected: boolean
  onClick: () => void
}

export function NodeCard({ node, selected, onClick }: Props) {
  const color = getNodeColor(node.type)

  return (
    <div
      className={`node-card${selected ? ' node-card--selected' : ''}`}
      style={{ '--node-color': color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="node-card__type">● {node.type.toUpperCase()}</div>
      <div className="node-card__title">{node.title}</div>
      <div className="node-card__overview">{node.overview}</div>
    </div>
  )
}
```

Add to `src/styles/app.css`:

```css
.node-card {
  background: var(--bg-node);
  border: 1px solid var(--border-muted);
  border-top: 2px solid var(--node-color, #7c3aed);
  border-radius: 4px;
  padding: 10px 14px;
  width: 180px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
  transition: box-shadow 0.15s;
}

.node-card--selected {
  border: 2px solid var(--node-color, #7c3aed);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--node-color, #7c3aed) 15%, transparent);
}

.node-card__type {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--node-color, #7c3aed);
  margin-bottom: 4px;
  text-transform: uppercase;
}

.node-card__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.node-card__overview {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.4;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/NodeCard.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/NodeCard.tsx src/components/NodeCard.test.tsx src/styles/app.css
git commit -m "feat: add NodeCard component"
```

---

## Task 7: Graph canvas

**Files:**
- Create: `src/components/GraphCanvas.tsx`
- Create: `src/components/GraphCanvas.test.tsx`

- [ ] **Step 1: Write the tests**

Create `src/components/GraphCanvas.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GraphCanvas } from './GraphCanvas'
import type { GraphData } from '../types'

const mockGraph: GraphData = {
  nodes: [
    { id: 'bigbang', type: 'bigbang', title: 'Start', overview: 'Origin', content: '', mtime: 0 },
    { id: 'tool-use', type: 'concept', title: 'Tool Use', overview: 'Functions', content: '', mtime: 0 },
  ],
  edges: [
    { id: 'bigbang-tool-use-spawns', source: 'bigbang', target: 'tool-use', type: 'spawns', label: 'spawns' },
  ],
}

describe('GraphCanvas', () => {
  it('renders without crashing', () => {
    render(
      <GraphCanvas
        graph={mockGraph}
        selectedNodeId={null}
        onNodeSelect={() => {}}
      />
    )
  })

  it('calls onNodeSelect when a node is clicked', async () => {
    const onSelect = vi.fn()
    render(
      <GraphCanvas
        graph={mockGraph}
        selectedNodeId={null}
        onNodeSelect={onSelect}
      />
    )
    // React Flow renders nodes as divs with the node label
    const node = screen.getAllByText('Tool Use')[0]
    node.click()
    expect(onSelect).toHaveBeenCalledWith('tool-use')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/components/GraphCanvas.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement GraphCanvas**

Create `src/components/GraphCanvas.tsx`:

```typescript
import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import type { GraphData } from '../types'
import { NodeCard } from './NodeCard'
import { getEdgeColor } from '../constants'

const NODE_WIDTH = 200
const NODE_HEIGHT = 90

interface Props {
  graph: GraphData
  selectedNodeId: string | null
  onNodeSelect: (id: string) => void
}

function buildFlowElements(graph: GraphData, selectedNodeId: string | null) {
  // Use dagre to compute a top-down DAG layout
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })
  g.setDefaultEdgeLabel(() => ({}))

  graph.nodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  graph.edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)

  const nodes: Node[] = graph.nodes.map(n => {
    const pos = g.node(n.id)
    return {
      id: n.id,
      type: 'nodeCard',
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { node: n, selected: n.id === selectedNodeId },
    }
  })

  const edges: Edge[] = graph.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: { stroke: getEdgeColor(e.type) },
    markerEnd: { type: 'arrowclosed', color: getEdgeColor(e.type) },
    labelStyle: { fill: getEdgeColor(e.type), fontSize: 9, fontFamily: 'Courier New' },
    labelBgStyle: { fill: '#0d1117' },
  }))

  return { nodes, edges }
}

// Wrap NodeCard as a React Flow custom node
function NodeCardWrapper({ data }: { data: { node: Parameters<typeof NodeCard>[0]['node'], selected: boolean, onClick: () => void } }) {
  return <NodeCard node={data.node} selected={data.selected} onClick={data.onClick} />
}

const nodeTypes: NodeTypes = { nodeCard: NodeCardWrapper }

export function GraphCanvas({ graph, selectedNodeId, onNodeSelect }: Props) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowElements(graph, selectedNodeId),
    [graph, selectedNodeId]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeSelect(node.id)
  }, [onNodeSelect])

  return (
    <div style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#21262d"
          gap={22}
          size={1}
        />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/GraphCanvas.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Wire GraphCanvas into App**

Open `src/App.tsx`. Replace the placeholder `<p>` in `app-body` with:

```typescript
<GraphCanvas
  graph={graph}
  selectedNodeId={selectedNode?.id ?? null}
  onNodeSelect={id => {
    const node = graph.nodes.find(n => n.id === id) ?? null
    setSelectedNode(node)
  }}
/>
```

Add import: `import { GraphCanvas } from './components/GraphCanvas'`

- [ ] **Step 6: Smoke-test in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Expect: interactive graph with node cards on dark canvas. Clicking a node highlights it.

- [ ] **Step 7: Commit**

```bash
git add src/components/GraphCanvas.tsx src/components/GraphCanvas.test.tsx src/App.tsx
git commit -m "feat: add React Flow graph canvas with custom node cards"
```

---

## Task 8: Detail panel

**Files:**
- Create: `src/components/Panel.tsx`
- Create: `src/components/Panel.test.tsx`

- [ ] **Step 1: Write the tests**

Create `src/components/Panel.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Panel } from './Panel'
import type { GraphData, GraphNode } from '../types'

const graph: GraphData = {
  nodes: [
    { id: 'bigbang', type: 'bigbang', title: 'Agentic Coding', overview: 'The origin', content: '', mtime: Date.now() - 1000 },
    { id: 'tool-use', type: 'concept', title: 'Tool Use', overview: 'Functions', content: '# Tool Use\n\nDetails here.', mtime: Date.now() },
  ],
  edges: [
    { id: 'bigbang-tool-use-spawns', source: 'bigbang', target: 'tool-use', type: 'spawns', label: 'spawns' },
  ],
}

describe('Panel — KB overview (no node selected)', () => {
  it('shows KB name from bigbang node title', () => {
    render(<Panel graph={graph} selectedNode={null} />)
    expect(screen.getByText('Agentic Coding')).toBeInTheDocument()
  })

  it('shows node type counts', () => {
    render(<Panel graph={graph} selectedNode={null} />)
    expect(screen.getByText('bigbang')).toBeInTheDocument()
    expect(screen.getByText('concept')).toBeInTheDocument()
  })

  it('shows recent nodes (most recently modified first)', () => {
    render(<Panel graph={graph} selectedNode={null} />)
    // tool-use has higher mtime so appears first
    const items = screen.getAllByText(/Tool Use|Agentic Coding/)
    expect(items[0].textContent).toContain('Tool Use')
  })
})

describe('Panel — node detail (node selected)', () => {
  const selected: GraphNode = graph.nodes[1]

  it('shows selected node title', () => {
    render(<Panel graph={graph} selectedNode={selected} />)
    expect(screen.getByText('Tool Use')).toBeInTheDocument()
  })

  it('shows incoming connections', () => {
    render(<Panel graph={graph} selectedNode={selected} />)
    expect(screen.getByText(/spawns/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/components/Panel.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Panel**

Create `src/components/Panel.tsx`:

```typescript
import { useMemo } from 'react'
import { marked } from 'marked'
import type { GraphData, GraphNode, GraphEdge } from '../types'
import { getEdgeColor, getNodeColor } from '../constants'

interface Connection {
  edge: GraphEdge
  node: GraphNode | undefined
}

interface Connections {
  incoming: Connection[]
  outgoing: Connection[]
}

interface Props {
  graph: GraphData
  selectedNode: GraphNode | null
}

export function Panel({ graph, selectedNode }: Props) {
  const bigbang = useMemo(
    () => graph.nodes.find(n => n.type === 'bigbang'),
    [graph]
  )

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const n of graph.nodes) {
      counts[n.type] = (counts[n.type] ?? 0) + 1
    }
    return Object.entries(counts)
  }, [graph])

  const recentNodes = useMemo(
    () => [...graph.nodes].sort((a, b) => b.mtime - a.mtime).slice(0, 5),
    [graph]
  )

  const connections: Connections = useMemo(() => {
    if (!selectedNode) return { incoming: [], outgoing: [] }
    const incoming = graph.edges
      .filter(e => e.target === selectedNode.id)
      .map(e => ({ edge: e, node: graph.nodes.find(n => n.id === e.source) }))
    const outgoing = graph.edges
      .filter(e => e.source === selectedNode.id)
      .map(e => ({ edge: e, node: graph.nodes.find(n => n.id === e.target) }))
    return { incoming, outgoing }
  }, [graph, selectedNode])

  return (
    <aside className="panel">
      {selectedNode ? (
        <NodeDetailView node={selectedNode} connections={connections} />
      ) : (
        <KBOverviewView
          bigbang={bigbang}
          typeCounts={typeCounts}
          recentNodes={recentNodes}
        />
      )}
    </aside>
  )
}

function KBOverviewView({
  bigbang,
  typeCounts,
  recentNodes,
}: {
  bigbang: GraphNode | undefined
  typeCounts: [string, number][]
  recentNodes: GraphNode[]
}) {
  return (
    <>
      <div className="panel-section panel-section--header">
        <div className="panel-label">knowledge base</div>
        <div className="panel-title">{bigbang?.title ?? '—'}</div>
        <div className="panel-overview">{bigbang?.overview}</div>
      </div>
      <div className="panel-section">
        <div className="panel-label">nodes</div>
        <div className="panel-counts">
          {typeCounts.map(([type, count]) => (
            <div key={type} className="panel-count-row" style={{ color: getNodeColor(type) }}>
              <span className="panel-count-num">{count}</span>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel-section panel-section--grow">
        <div className="panel-label">recent</div>
        {recentNodes.map(n => (
          <div key={n.id} className="panel-recent-node">
            <span style={{ color: getNodeColor(n.type) }}>●</span> {n.title}
          </div>
        ))}
      </div>
    </>
  )
}

function NodeDetailView({
  node,
  connections,
}: {
  node: GraphNode
  connections: Connections
}) {
  return (
    <>
      <div className="panel-section panel-section--header">
        <div className="panel-label" style={{ color: getNodeColor(node.type) }}>
          ● {node.type.toUpperCase()}
        </div>
        <div className="panel-title">{node.title}</div>
        <div className="panel-overview">{node.overview}</div>
      </div>
      <div
        className="panel-section panel-section--grow panel-content"
        dangerouslySetInnerHTML={{ __html: marked(node.content) as string }}
      />
      <div className="panel-section">
        <div className="panel-label">connections</div>
        {connections.incoming.map(({ edge, node: src }) => src && (
          <div key={edge.id} className="panel-connection" style={{ color: getEdgeColor(edge.type) }}>
            ← {edge.label} {src.title}
          </div>
        ))}
        {connections.outgoing.map(({ edge, node: tgt }) => tgt && (
          <div key={edge.id} className="panel-connection" style={{ color: getEdgeColor(edge.type) }}>
            → {edge.label} {tgt.title}
          </div>
        ))}
      </div>
    </>
  )
}
```

Add panel CSS to `src/styles/app.css`:

```css
.panel {
  width: 200px;
  background: var(--bg-panel);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.panel-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.panel-section--header {}

.panel-section--grow {
  flex: 1;
  border-bottom: none;
}

.panel-label {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.panel-overview {
  font-size: 9px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.panel-count-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  margin-bottom: 3px;
}

.panel-count-num {
  font-size: 15px;
  font-weight: 700;
  min-width: 24px;
}

.panel-recent-node {
  font-size: 9px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.panel-content {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.panel-content h1, .panel-content h2, .panel-content h3 {
  color: var(--text-primary);
  font-size: 11px;
  margin: 8px 0 4px;
}

.panel-connection {
  font-size: 9px;
  margin-bottom: 3px;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/components/Panel.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Wire Panel into App**

Open `src/App.tsx`. In the `app-body` div, add `Panel` after `GraphCanvas`:

```typescript
<GraphCanvas ... />
<Panel graph={graph} selectedNode={selectedNode} />
```

Add import: `import { Panel } from './components/Panel'`

- [ ] **Step 6: Smoke-test in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Expect: KB overview in right panel by default. Clicking a node shows its detail. `⌂ home` clears selection.

- [ ] **Step 7: Commit**

```bash
git add src/components/Panel.tsx src/components/Panel.test.tsx src/styles/app.css src/App.tsx
git commit -m "feat: add detail panel with KB overview and node detail views"
```

---

## Task 9: Full test run + cleanup

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```

Expected: all tests PASS, no skipped.

- [ ] **Step 2: Run the app end-to-end**

```bash
npm run build:graph && npm run dev
```

Verify:
- Dark canvas with dot grid renders
- Bigbang node is visible with gold border
- Connected nodes appear
- Clicking a node highlights it and updates the panel
- `⌂ home` clears selection and shows KB overview

- [ ] **Step 3: Add `public/graph.json` to .gitignore and untrack it**

Open `.gitignore` and add:

```
public/graph.json
```

Then untrack the already-committed file:

```bash
git rm --cached public/graph.json
```

- [ ] **Step 4: Final commit**

```bash
git add .gitignore
git commit -m "chore: gitignore generated graph.json and untrack it"
```

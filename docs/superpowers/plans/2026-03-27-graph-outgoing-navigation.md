# Graph Outgoing Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking a node in the graph shows all nodes that node leads to (outgoing edges only), and the sample KB has the edges needed to make this navigable.

**Architecture:** Two independent changes — (1) change the neighborhood algorithm in `GraphCanvas.tsx` from bidirectional to outgoing-only by filtering on `e.source === focusId`, and (2) add a `from: [{source: bigbang, edge: "covers"}]` entry to `tool-use.md` so bigbang connects to the rest of the graph.

**Tech Stack:** React, TypeScript, Vitest, `@testing-library/react`

---

## File Map

| File | Change |
|------|--------|
| `src/components/GraphCanvas.tsx` | Export `getNeighborhood`; change filter to outgoing-only |
| `src/components/GraphCanvas.test.tsx` | Add test for outgoing-only behavior |
| `content/sample-kb/tool-use.md` | Add `from: [{source: bigbang, edge: "covers"}]` |
| `scripts/build-graph.test.ts` | Add test for bigbang → tool-use edge |

---

### Task 1: Outgoing-only neighborhood algorithm

**Files:**
- Modify: `src/components/GraphCanvas.tsx`
- Modify: `src/components/GraphCanvas.test.tsx`

- [ ] **Step 1: Export `getNeighborhood` from GraphCanvas**

In `src/components/GraphCanvas.tsx`, change the function declaration from:

```ts
function getNeighborhood(graphData: GraphData, focusId: string) {
```

to:

```ts
export function getNeighborhood(graphData: GraphData, focusId: string) {
```

- [ ] **Step 2: Write the failing test**

Add this test to `src/components/GraphCanvas.test.tsx`, after the existing import block:

```ts
import { getNeighborhood } from './GraphCanvas'
```

Then add inside the `describe('GraphCanvas', ...)` block:

```ts
it('neighborhood includes only outgoing edges from focus node', () => {
  const data: GraphData = {
    nodes: [
      { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
      { id: 'child', type: 'concept', title: 'Child', overview: '', content: '', mtime: 0 },
      { id: 'parent', type: 'concept', title: 'Parent', overview: '', content: '', mtime: 0 },
    ],
    edges: [
      { id: 'root-child', source: 'root', target: 'child', type: 'links', label: 'links' },
      { id: 'parent-root', source: 'parent', target: 'root', type: 'links', label: 'links' },
    ],
  }
  const { nodes } = getNeighborhood(data, 'root')
  const ids = nodes.map(n => n.id)
  expect(ids).toContain('root')
  expect(ids).toContain('child')
  expect(ids).not.toContain('parent')
})
```

- [ ] **Step 3: Run the test to confirm it fails**

```bash
npx vitest run src/components/GraphCanvas.test.tsx
```

Expected: FAIL — `parent` is currently included because of the bidirectional check.

- [ ] **Step 4: Change the filter to outgoing-only**

In `src/components/GraphCanvas.tsx`, inside `getNeighborhood`, change:

```ts
  graphData.edges.forEach(e => {
    if (e.source === focusId || e.target === focusId) {
```

to:

```ts
  graphData.edges.forEach(e => {
    if (e.source === focusId) {
```

- [ ] **Step 5: Run all tests and confirm they pass**

```bash
npx vitest run src/components/GraphCanvas.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/GraphCanvas.tsx src/components/GraphCanvas.test.tsx
git commit -m "feat: graph navigates outgoing edges only on node click"
```

---

### Task 2: Connect bigbang to tool-use in sample KB

**Files:**
- Modify: `content/sample-kb/tool-use.md`
- Modify: `scripts/build-graph.test.ts`

- [ ] **Step 1: Write the failing test**

In `scripts/build-graph.test.ts`, add a new test inside `describe('buildKb', ...)`:

```ts
it('includes bigbang → tool-use edge', () => {
  const kbDir = path.resolve(__dirname, '../content/sample-kb')
  const result = buildKb(kbDir)
  const edge = result.edges.find(e => e.source === 'bigbang' && e.target === 'tool-use')
  expect(edge).toBeDefined()
  expect(edge?.label).toBe('covers')
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run scripts/build-graph.test.ts
```

Expected: FAIL — no `bigbang → tool-use` edge exists yet.

- [ ] **Step 3: Add the edge to tool-use.md**

Change `content/sample-kb/tool-use.md` frontmatter from:

```yaml
---
type: concept
title: Tool Use
overview: "Calling external functions from an LLM"
---
```

to:

```yaml
---
type: concept
title: Tool Use
overview: "Calling external functions from an LLM"
from:
  - source: bigbang
    edge: "covers"
---
```

- [ ] **Step 4: Run all build-graph tests and confirm they pass**

```bash
npx vitest run scripts/build-graph.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Rebuild the graph JSON**

```bash
npm run build:graph
```

Expected output:
```
Wrote manifest.json (1 KBs)
Wrote graph/sample-kb.json (5 nodes, 4 edges)
```

- [ ] **Step 6: Commit**

```bash
git add content/sample-kb/tool-use.md scripts/build-graph.test.ts
git commit -m "feat: connect bigbang to tool-use in sample KB"
```

---

### Task 3: Manual smoke test

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 2: Start the dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173`.

- [ ] **Step 3: Verify the navigation**

1. Click the "Agentic Coding" KB card → you land on the graph page
2. The graph shows **bigbang** + **tool-use** + **errors** as its outgoing connections
3. Click **tool-use** → graph updates to show **claude-code** and **anthropic-docs**
4. Click **claude-code** → graph updates to show claude-code alone (no outgoing edges)
5. The right panel always shows the selected node's detail and its incoming/outgoing connections as text

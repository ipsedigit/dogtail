# Filename-Based Node IDs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace title-derived node IDs with filename stems, and remove `slugify` entirely.

**Architecture:** Node ID = `path.basename(file, '.md')`. Edge `from:` entries reference source nodes by filename stem. The React app is untouched — it reads whatever IDs `graph.json` contains.

**Tech Stack:** TypeScript, Node.js, Vitest, gray-matter

---

### Task 1: Write failing test for filename-based node IDs

**Files:**
- Modify: `scripts/build-graph.test.ts`

- [ ] **Step 1: Add a failing test using a temp fixture**

In `scripts/build-graph.test.ts`, add this test inside the `describe('buildKb', ...)` block, and add the necessary imports at the top:

```typescript
// Add to top imports:
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
```

```typescript
// Add inside describe('buildKb', ...):
it('uses filename stem as node id, not the title', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'dogtail-test-'))
  writeFileSync(
    path.join(dir, 'my-file.md'),
    '---\ntype: concept\ntitle: My Different Title\noverview: test\n---\ncontent'
  )
  const result = buildKb(dir)
  expect(result.nodes[0].id).toBe('my-file')
})
```

Also rename the existing test at line 27 from `'generates stable node ids from titles'` to `'generates node ids from filenames'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run`

Expected: FAIL on `'uses filename stem as node id, not the title'` with something like:
```
AssertionError: expected 'my-different-title' to be 'my-file'
```

---

### Task 2: Remove `slugify` and use filename stem

**Files:**
- Modify: `scripts/build-graph.ts`

- [ ] **Step 1: Remove `slugify` and update node ID + edge source**

Replace the entire `buildKb` function and remove the `slugify` function. The file should look like this after the change:

```typescript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import type { GraphNode, GraphEdge, GraphData, KbMeta, Manifest } from '../src/types.js'

export function buildKb(kbDir: string): GraphData {
  const files = fs.readdirSync(kbDir).filter(f => f.endsWith('.md'))
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (const file of files) {
    const filePath = path.join(kbDir, file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)
    const id = path.basename(file, '.md')
    nodes.push({
      id,
      type: data.type ?? 'unknown',
      title: data.title ?? id,
      overview: data.overview ?? '',
      content: content.trim(),
      mtime: fs.statSync(filePath).mtimeMs,
    })
    if (Array.isArray(data.from)) {
      for (const edge of data.from) {
        const sourceId = edge.source
        edges.push({
          id: `${sourceId}-${id}-${edge.edge}`,
          source: sourceId,
          target: id,
          type: edge.edge,
          label: edge.edge,
        })
      }
    }
  }

  return { nodes, edges }
}

function buildManifest(contentDir: string): Manifest {
  const slugs = fs.readdirSync(contentDir).filter(name =>
    fs.statSync(path.join(contentDir, name)).isDirectory()
  )
  const kbs: KbMeta[] = []
  for (const slug of slugs) {
    const data = buildKb(path.join(contentDir, slug))
    const bigbang = data.nodes.find(n => n.type === 'bigbang')
    kbs.push({
      slug,
      title: bigbang?.title ?? slug,
      overview: bigbang?.overview ?? '',
      nodeCount: data.nodes.length,
      updatedAt: data.nodes.length > 0 ? Math.max(...data.nodes.map(n => n.mtime)) : 0,
    })
  }
  return { kbs }
}

// CLI entry point — only runs when invoked directly (not when imported by tests)
const __filename = fileURLToPath(import.meta.url)
const isMain = process.argv[1] === __filename ||
               process.argv[1] === __filename.replace(/\.ts$/, '.js')

if (isMain) {
  const contentDir = path.resolve('content')
  const outDir = path.resolve('public/graph')
  fs.mkdirSync(outDir, { recursive: true })

  const manifest = buildManifest(contentDir)
  fs.writeFileSync(path.resolve('public/manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`Wrote manifest.json (${manifest.kbs.length} KBs)`)

  for (const kb of manifest.kbs) {
    const data = buildKb(path.join(contentDir, kb.slug))
    fs.writeFileSync(path.join(outDir, `${kb.slug}.json`), JSON.stringify(data, null, 2))
    console.log(`Wrote graph/${kb.slug}.json (${data.nodes.length} nodes, ${data.edges.length} edges)`)
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm run test:run`

Expected: all tests PASS including `'uses filename stem as node id, not the title'`

---

### Task 3: Update content files to use filename stems in `from:` entries

**Files:**
- Modify: `content/sample-kb/claude-code.md`
- Modify: `content/sample-kb/anthropic-docs.md`

- [ ] **Step 1: Update `claude-code.md`**

Change the `from:` block from:
```yaml
from:
  - source: "Tool Use"
    edge: "requires"
```
to:
```yaml
from:
  - source: tool-use
    edge: "requires"
```

- [ ] **Step 2: Update `anthropic-docs.md`**

Change the `from:` block from:
```yaml
from:
  - source: "Tool Use"
    edge: "see also"
```
to:
```yaml
from:
  - source: tool-use
    edge: "see also"
```

- [ ] **Step 3: Rebuild graph and verify**

Run: `npm run build:graph`

Expected output:
```
Wrote manifest.json (1 KBs)
Wrote graph/sample-kb.json (4 nodes, 2 edges)
```

- [ ] **Step 4: Run full test suite**

Run: `npm run test:run`

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/build-graph.ts scripts/build-graph.test.ts content/sample-kb/claude-code.md content/sample-kb/anthropic-docs.md public/graph/sample-kb.json public/manifest.json
git commit -m "Use filename stem as node ID instead of slugified title"
```

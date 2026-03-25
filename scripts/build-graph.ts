import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import type { GraphNode, GraphEdge, GraphData, KbMeta, Manifest } from '../src/types.js'

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function buildKb(kbDir: string): GraphData {
  const files = fs.readdirSync(kbDir).filter(f => f.endsWith('.md'))
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (const file of files) {
    const filePath = path.join(kbDir, file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)
    const id = slugify(data.title ?? file.replace('.md', ''))
    nodes.push({
      id,
      type: data.type ?? 'unknown',
      title: data.title ?? file.replace('.md', ''),
      overview: data.overview ?? '',
      content: content.trim(),
      mtime: fs.statSync(filePath).mtimeMs,
    })
    if (Array.isArray(data.from)) {
      for (const edge of data.from) {
        const sourceId = slugify(edge.source)
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

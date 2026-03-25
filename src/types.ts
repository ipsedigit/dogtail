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

export interface KbMeta {
  slug: string
  title: string
  overview: string
  nodeCount: number
  updatedAt: number       // ms timestamp of most-recently-modified node
}

export interface Manifest {
  kbs: KbMeta[]
}

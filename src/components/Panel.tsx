import { marked } from 'marked'
import type { GraphData, GraphNode, KbMeta } from '../types'

interface Props {
  kb: KbMeta
  graphData: GraphData
  selectedNode: GraphNode | null
  edgeColors: Record<string, string>
}

export default function Panel({ kb, graphData, selectedNode, edgeColors }: Props) {
  return (
    <aside className="panel">
      <div className="panel-body">
        {selectedNode
          ? <NodeDetail node={selectedNode} graphData={graphData} />
          : <KbOverview kb={kb} graphData={graphData} />}
      </div>
      <EdgeLegend edgeColors={edgeColors} />
    </aside>
  )
}

function KbOverview({ kb, graphData }: { kb: KbMeta; graphData: GraphData }) {
  const typeCounts = graphData.nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1
    return acc
  }, {})
  const recent = [...graphData.nodes].sort((a, b) => b.mtime - a.mtime).slice(0, 5)

  return (
    <div className="panel-overview">
      <div className="panel-label">knowledge base</div>
      <div className="panel-title">{kb.title}</div>
      <div className="panel-text">{kb.overview}</div>
      <div className="panel-text">{kb.nodeCount} nodes</div>
      <div className="panel-label" style={{ marginTop: 14 }}>node types</div>
      {Object.entries(typeCounts).map(([type, count]) => (
        <div key={type} className="panel-row">
          <span>{type}</span><span>{count}</span>
        </div>
      ))}
      <div className="panel-label" style={{ marginTop: 14 }}>recently modified</div>
      {recent.map(n => <div key={n.id} className="panel-text">{n.title}</div>)}
    </div>
  )
}

function NodeDetail({ node, graphData }: { node: GraphNode; graphData: GraphData }) {
  const incoming = graphData.edges.filter(e => e.target === node.id)
  const outgoing = graphData.edges.filter(e => e.source === node.id)
  const html = marked.parse(node.content) as string

  return (
    <div className="panel-detail">
      <div className="panel-label">{node.type}</div>
      <div className="panel-title">{node.title}</div>
      <div className="panel-content" dangerouslySetInnerHTML={{ __html: html }} />
      {(incoming.length > 0 || outgoing.length > 0) && (
        <div style={{ marginTop: 14 }}>
          <div className="panel-label">connections</div>
          {incoming.map(e => {
            const src = graphData.nodes.find(n => n.id === e.source)
            return <div key={e.id} className="panel-edge">← {e.label} {src?.title}</div>
          })}
          {outgoing.map(e => {
            const tgt = graphData.nodes.find(n => n.id === e.target)
            return <div key={e.id} className="panel-edge">→ {e.label} {tgt?.title}</div>
          })}
        </div>
      )}
    </div>
  )
}

function EdgeLegend({ edgeColors }: { edgeColors: Record<string, string> }) {
  const entries = Object.entries(edgeColors)
  if (entries.length === 0) return null
  return (
    <div className="panel-legend">
      <div className="panel-label">edge types</div>
      {entries.map(([label, color]) => (
        <div key={label} className="panel-legend-row">
          <div className="panel-legend-line" style={{ background: color }} />
          <span style={{ color }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

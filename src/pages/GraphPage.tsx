import { useState, useEffect, useMemo } from 'react'
import type { KbMeta, GraphData, GraphNode } from '../types'
import { NODE_TYPE_PALETTE, EDGE_TYPE_PALETTE } from '../constants'
import GraphCanvas from '../components/GraphCanvas'
import Panel from '../components/Panel'

function assignColors(values: string[], palette: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((v, i) => [v, palette[i % palette.length]]))
}

interface Props {
  kb: KbMeta
  onBack: () => void
}

export default function GraphPage({ kb, onBack }: Props) {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/graph/${kb.slug}.json`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: GraphData) => {
        setGraphData(data)
        const bb = data.nodes.find(n => n.type === 'bigbang') ?? data.nodes[0]
        setFocusNodeId(bb?.id ?? null)
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
    setFocusNodeId(node.id)
  }

  if (error) return <div className="error-screen">{error}</div>
  if (!graphData || !focusNodeId) return <div className="loading-screen">Loading...</div>

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
          focusNodeId={focusNodeId}
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

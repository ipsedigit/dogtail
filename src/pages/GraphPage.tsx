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
      const currentIsSameNode = splashHistory[splashIndex]?.id === node.id
      const hasForwardHistory = splashIndex < splashHistory.length - 1
      if (currentIsSameNode && !hasForwardHistory) {
        // toggle off: same node, no forward history to clear
        setSplashHistory([])
        setSplashIndex(-1)
      } else {
        // open fresh: new node OR same node with forward history to reset
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

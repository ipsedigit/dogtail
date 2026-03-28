import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
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
    style: { stroke: edgeColors[e.type] ?? '#6e7681', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors[e.type] ?? '#6e7681' },
    labelStyle: { fill: edgeColors[e.type] ?? '#6e7681', fontSize: 11, fontFamily: 'monospace' },
    labelBgStyle: { fill: '#0d1117', borderRadius: 3, fillOpacity: 0.85 },
  })), [visibleEdges, edgeColors])

  const laid = useMemo(() => layoutNodes(rawNodes, rawEdges), [rawNodes, rawEdges])
  const [nodes, setNodes, onNodesChange] = useNodesState(laid)

  useEffect(() => { setNodes(laid) }, [laid, setNodes])

  return (
    <ReactFlow
      nodes={nodes}
      edges={rawEdges}
      onNodesChange={onNodesChange}
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

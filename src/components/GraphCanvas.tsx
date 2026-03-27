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

export function getNeighborhood(graphData: GraphData, focusId: string) {
  const ids = new Set([focusId])
  const edgeIds = new Set<string>()
  graphData.edges.forEach(e => {
    if (e.source === focusId) {
      ids.add(e.target)
      edgeIds.add(e.id)
    }
  })
  return { nodes: graphData.nodes.filter(n => ids.has(n.id)), edgeIds }
}

const nodeTypes = { default: NodeCard }

interface Props {
  graphData: GraphData
  focusNodeId: string
  selectedNodeId: string | null
  onNodeClick: (node: GraphNode) => void
  nodeColors: Record<string, string>
  edgeColors: Record<string, string>
}

export default function GraphCanvas({
  graphData, focusNodeId, selectedNodeId, onNodeClick, nodeColors, edgeColors,
}: Props) {
  const { nodes: neighborNodes, edgeIds } = useMemo(
    () => getNeighborhood(graphData, focusNodeId),
    [graphData, focusNodeId]
  )

  const rawNodes: Node[] = useMemo(() => neighborNodes.map(n => ({
    id: n.id,
    type: 'default',
    position: { x: 0, y: 0 },
    data: { ...n, color: nodeColors[n.type] ?? '#6e7681' },
    selected: n.id === selectedNodeId,
  })), [neighborNodes, nodeColors, selectedNodeId])

  const rawEdges: Edge[] = useMemo(() => graphData.edges
    .filter(e => edgeIds.has(e.id))
    .map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      style: { stroke: edgeColors[e.type] ?? '#6e7681' },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColors[e.type] ?? '#6e7681' },
      labelStyle: { fill: edgeColors[e.type] ?? '#6e7681', fontSize: 9, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#0d1117' },
    })), [graphData.edges, edgeIds, edgeColors])

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

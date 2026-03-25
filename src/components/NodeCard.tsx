import { Handle, Position } from '@xyflow/react'
import type { GraphNode } from '../types'

interface NodeData extends GraphNode {
  color: string
}

interface Props {
  data: NodeData
  selected: boolean
}

export default function NodeCard({ data, selected }: Props) {
  return (
    <div
      className="node-card"
      style={{
        borderTopColor: data.color,
        boxShadow: selected ? `0 0 0 2px ${data.color}` : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="node-type" style={{ color: data.color }}>
        ● {data.type.toUpperCase()}
      </div>
      <div className="node-title">{data.title}</div>
      <div className="node-overview">{data.overview}</div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

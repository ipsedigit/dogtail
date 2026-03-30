import { useEffect, useMemo } from 'react'
import { marked } from 'marked'
import type { GraphNode } from '../types'

interface NeighborEntry {
  node: GraphNode
  edgeLabel: string
  color: string
}

interface Props {
  node: GraphNode
  color: string
  neighbors?: NeighborEntry[]
  onClose: () => void
  onNavigate?: (node: GraphNode) => void
}

export default function NodeSplash({
  node,
  color,
  neighbors = [],
  onClose,
  onNavigate,
}: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const html = useMemo(() => marked.parse(node.content) as string, [node.content])

  return (
    <div className="node-splash-backdrop" onClick={onClose}>
      <div className="node-splash-card" onClick={e => e.stopPropagation()}>
        <button className="node-splash-close" onClick={onClose}>✕ close</button>
        <div className="node-splash-type" style={{ color }}>● {node.type.toUpperCase()}</div>
        <div className="node-splash-title">{node.title}</div>
        <div
          className="node-splash-accent"
          style={{ background: `linear-gradient(to right, ${color}, transparent)` }}
        />
        {node.overview && (
          <div className="node-splash-overview">{node.overview}</div>
        )}
        <div
          className="node-splash-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {neighbors.length > 0 && (
          <div className="node-splash-connected">
            <div className="node-splash-connected-label">Connected</div>
            <div className="node-splash-connected-chips">
              {neighbors.map(n => (
                <button
                  key={n.node.id}
                  className="node-splash-chip"
                  style={{ color: n.color }}
                  onClick={() => onNavigate?.(n.node)}
                >
                  ● {n.node.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

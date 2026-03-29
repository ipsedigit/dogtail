import { useEffect, useMemo } from 'react'
import { marked } from 'marked'
import type { GraphNode } from '../types'

interface Props {
  node: GraphNode
  color: string
  onClose: () => void
}

export default function NodeSplash({ node, color, onClose }: Props) {
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
      </div>
    </div>
  )
}

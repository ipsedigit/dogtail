import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import GraphCanvas, { getVisibleSubgraph } from './GraphCanvas'
import type { GraphData } from '../types'

const graphData: GraphData = {
  nodes: [
    { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
    { id: 'child', type: 'concept', title: 'Child', overview: '', content: '', mtime: 0 },
  ],
  edges: [{ id: 'root-child-links', source: 'root', target: 'child', type: 'links', label: 'links' }],
}

describe('GraphCanvas', () => {
  it('renders a React Flow container', () => {
    render(
      <GraphCanvas
        graphData={graphData}
        visibleIds={new Set(['root', 'child'])}
        selectedNodeId={null}
        onNodeClick={vi.fn()}
        nodeColors={{ bigbang: '#7c3aed', concept: '#0ea5e9' }}
        edgeColors={{ links: '#e879f9' }}
      />
    )
    expect(document.querySelector('.react-flow')).toBeInTheDocument()
  })

  it('getVisibleSubgraph returns only nodes in the visible set', () => {
    const data: GraphData = {
      nodes: [
        { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
        { id: 'child', type: 'concept', title: 'Child', overview: '', content: '', mtime: 0 },
        { id: 'other', type: 'concept', title: 'Other', overview: '', content: '', mtime: 0 },
      ],
      edges: [
        { id: 'root-child', source: 'root', target: 'child', type: 'links', label: 'links' },
        { id: 'root-other', source: 'root', target: 'other', type: 'links', label: 'links' },
      ],
    }
    const { nodes, edges } = getVisibleSubgraph(data, new Set(['root', 'child']))
    const ids = nodes.map(n => n.id)
    expect(ids).toContain('root')
    expect(ids).toContain('child')
    expect(ids).not.toContain('other')
    // edge only appears when both endpoints are visible
    expect(edges.map(e => e.id)).toContain('root-child')
    expect(edges.map(e => e.id)).not.toContain('root-other')
  })
})

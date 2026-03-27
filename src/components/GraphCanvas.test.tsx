import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import GraphCanvas, { getNeighborhood } from './GraphCanvas'
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
        focusNodeId="root"
        selectedNodeId={null}
        onNodeClick={vi.fn()}
        nodeColors={{ bigbang: '#7c3aed', concept: '#0ea5e9' }}
        edgeColors={{ links: '#e879f9' }}
      />
    )
    expect(document.querySelector('.react-flow')).toBeInTheDocument()
  })

  it('neighborhood includes only outgoing edges from focus node', () => {
    const data: GraphData = {
      nodes: [
        { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
        { id: 'child', type: 'concept', title: 'Child', overview: '', content: '', mtime: 0 },
        { id: 'parent', type: 'concept', title: 'Parent', overview: '', content: '', mtime: 0 },
      ],
      edges: [
        { id: 'root-child', source: 'root', target: 'child', type: 'links', label: 'links' },
        { id: 'parent-root', source: 'parent', target: 'root', type: 'links', label: 'links' },
      ],
    }
    const { nodes, edgeIds } = getNeighborhood(data, 'root')
    const ids = nodes.map(n => n.id)
    expect(ids).toContain('root')
    expect(ids).toContain('child')
    expect(ids).not.toContain('parent')
    expect(edgeIds).toContain('root-child')
    expect(edgeIds).not.toContain('parent-root')
  })
})

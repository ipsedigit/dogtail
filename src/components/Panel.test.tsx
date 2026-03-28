import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Panel from './Panel'
import type { GraphData, KbMeta } from '../types'

const nodeColors = { bigbang: '#7c3aed', concept: '#0ea5e9' }

const kb: KbMeta = { slug: 'test', title: 'Test KB', overview: 'A test KB', nodeCount: 3, updatedAt: 0 }

const graphData: GraphData = {
  nodes: [
    { id: 'root', type: 'bigbang', title: 'Root', overview: 'The root', content: '', mtime: 100 },
    { id: 'child', type: 'concept', title: 'Concept A', overview: 'First', content: '# Hello', mtime: 200 },
  ],
  edges: [{ id: 'root-child-uses', source: 'root', target: 'child', type: 'uses', label: 'uses' }],
}

describe('Panel', () => {
  it('shows KB overview when no node selected', () => {
    render(<Panel kb={kb} graphData={graphData} selectedNode={null} edgeColors={{}} />)
    expect(screen.getByText('Test KB')).toBeInTheDocument()
    expect(screen.getByText('3 nodes')).toBeInTheDocument()
  })

  it('shows node detail when a node is selected', () => {
    render(<Panel kb={kb} graphData={graphData} selectedNode={graphData.nodes[1]} edgeColors={{}} />)
    expect(screen.getByText('Concept A')).toBeInTheDocument()
  })

  it('shows outgoing connection in node detail', () => {
    render(<Panel kb={kb} graphData={graphData} selectedNode={graphData.nodes[0]} edgeColors={{}} />)
    expect(screen.getByText(/uses/i)).toBeInTheDocument()
  })

  it('shows edge legend', () => {
    render(<Panel kb={kb} graphData={graphData} selectedNode={null} edgeColors={{ uses: '#e879f9' }} />)
    expect(screen.getAllByText('uses').length).toBeGreaterThan(0)
  })

  it('panel is 380px wide when a node is selected', () => {
    const { container } = render(
      <Panel kb={kb} graphData={graphData} selectedNode={graphData.nodes[1]} edgeColors={{}} nodeColors={nodeColors} />
    )
    const panel = container.querySelector('.panel') as HTMLElement
    expect(panel.style.width).toBe('380px')
  })

  it('panel is 240px wide when no node is selected', () => {
    const { container } = render(
      <Panel kb={kb} graphData={graphData} selectedNode={null} edgeColors={{}} nodeColors={nodeColors} />
    )
    const panel = container.querySelector('.panel') as HTMLElement
    expect(panel.style.width).toBe('240px')
  })

  it('node detail shows overview text', () => {
    render(
      <Panel kb={kb} graphData={graphData} selectedNode={graphData.nodes[1]} edgeColors={{}} nodeColors={nodeColors} />
    )
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('connection label uses edge color', () => {
    render(
      <Panel kb={kb} graphData={graphData} selectedNode={graphData.nodes[0]} edgeColors={{ uses: '#e879f9' }} nodeColors={nodeColors} />
    )
    const edgeEl = screen.getByText(/uses.*Concept A/i)
    expect(edgeEl.style.color).toBe('rgb(232, 121, 249)')
  })
})

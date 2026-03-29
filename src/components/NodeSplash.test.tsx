import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NodeSplash from './NodeSplash'
import type { GraphNode } from '../types'

const node: GraphNode = {
  id: 'tool-use',
  type: 'concept',
  title: 'Tool Use',
  overview: 'How models call external functions',
  content: '## Details\n\nTool use bridges language and action.',
  mtime: 0,
}

describe('NodeSplash', () => {
  it('renders type, title, overview, and markdown content', () => {
    render(<NodeSplash node={node} color="#7c3aed" onClose={vi.fn()} />)
    expect(screen.getByText(/CONCEPT/i)).toBeInTheDocument()
    expect(screen.getByText('Tool Use')).toBeInTheDocument()
    expect(screen.getByText(/How models call external functions/i)).toBeInTheDocument()
    expect(screen.getByText(/bridges language and action/i)).toBeInTheDocument()
  })

  it('does not render overview element when overview is empty', () => {
    const { container } = render(
      <NodeSplash node={{ ...node, overview: '' }} color="#7c3aed" onClose={vi.fn()} />
    )
    expect(container.querySelector('.node-splash-overview')).toBeNull()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.click(container.querySelector('.node-splash-backdrop')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when card interior is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.click(container.querySelector('.node-splash-card')!)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.click(screen.getByText(/close/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for other key presses', () => {
    const onClose = vi.fn()
    render(<NodeSplash node={node} color="#7c3aed" onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('NodeSplash — navigation', () => {
  const neighbor: GraphNode = {
    id: 'agent-loop',
    type: 'concept',
    title: 'Agent Loop',
    overview: '',
    content: '',
    mtime: 0,
  }

  it('back button is disabled when canGoBack is false', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        canGoBack={false} canGoForward={false}
        neighbors={[]} onNavigate={vi.fn()} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    expect(screen.getByText(/← back/i)).toBeDisabled()
  })

  it('back button calls onBack when canGoBack is true', () => {
    const onBack = vi.fn()
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        canGoBack={true} canGoForward={false}
        neighbors={[]} onNavigate={vi.fn()} onBack={onBack} onForward={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText(/← back/i))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('forward button is disabled when canGoForward is false', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        canGoBack={false} canGoForward={false}
        neighbors={[]} onNavigate={vi.fn()} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    expect(screen.getByText(/→ fwd/i)).toBeDisabled()
  })

  it('forward button calls onForward when canGoForward is true', () => {
    const onForward = vi.fn()
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        canGoBack={false} canGoForward={true}
        neighbors={[]} onNavigate={vi.fn()} onBack={vi.fn()} onForward={onForward}
      />
    )
    fireEvent.click(screen.getByText(/→ fwd/i))
    expect(onForward).toHaveBeenCalledTimes(1)
  })

  it('renders Connected section when neighbors are provided', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        neighbors={[{ node: neighbor, edgeLabel: 'links', color: '#d2a8ff' }]}
        onNavigate={vi.fn()} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    expect(screen.getByText(/connected/i)).toBeInTheDocument()
    expect(screen.getByText(/Agent Loop/i)).toBeInTheDocument()
  })

  it('does not render Connected section when neighbors is empty', () => {
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        neighbors={[]} onNavigate={vi.fn()} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    expect(screen.queryByText(/connected/i)).toBeNull()
  })

  it('clicking a neighbor chip calls onNavigate with the correct node', () => {
    const onNavigate = vi.fn()
    render(
      <NodeSplash
        node={node} color="#7c3aed" onClose={vi.fn()}
        neighbors={[{ node: neighbor, edgeLabel: 'links', color: '#d2a8ff' }]}
        onNavigate={onNavigate} onBack={vi.fn()} onForward={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText(/Agent Loop/i))
    expect(onNavigate).toHaveBeenCalledWith(neighbor)
  })
})

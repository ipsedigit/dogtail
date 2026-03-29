import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import GraphPage, { expandVisibleIds } from './GraphPage'
import type { KbMeta, GraphData } from '../types'

vi.mock('../components/GraphCanvas', () => ({
  default: ({ onNodeClick, graphData }: { onNodeClick: (n: any) => void; graphData: any }) => (
    <div>
      {graphData.nodes.map((n: any) => (
        <button key={n.id} data-testid={`node-${n.id}`} onClick={() => onNodeClick(n)}>
          {n.title}
        </button>
      ))}
    </div>
  ),
}))

const kb: KbMeta = { slug: 'sample-kb', title: 'Sample KB', overview: 'A test', nodeCount: 2, updatedAt: 0 }

const graphData: GraphData = {
  nodes: [
    { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
    { id: 'child', type: 'concept', title: 'Child', overview: '', content: '', mtime: 0 },
  ],
  edges: [],
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(graphData),
  }))
})

describe('GraphPage', () => {
  it('shows loading state initially', () => {
    render(<GraphPage kb={kb} onBack={vi.fn()} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('fetches the correct KB JSON', async () => {
    render(<GraphPage kb={kb} onBack={vi.fn()} />)
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/graph/sample-kb.json'))
  })

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn()
    render(<GraphPage kb={kb} onBack={onBack} />)
    await waitFor(() => screen.getByText(/home/i))
    screen.getByText(/home/i).click()
    expect(onBack).toHaveBeenCalled()
  })

  it('expandVisibleIds adds the clicked node and its outgoing targets', () => {
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
    const result = expandVisibleIds(data, new Set(['root']), 'root')
    expect(result.has('root')).toBe(true)
    expect(result.has('child')).toBe(true)
    expect(result.has('other')).toBe(true)
  })
})

describe('GraphPage — node splash', () => {
  const kbSplash: KbMeta = { slug: 'splash-kb', title: 'Splash KB', overview: '', nodeCount: 2, updatedAt: 0 }

  const graphDataWithContent: GraphData = {
    nodes: [
      { id: 'root', type: 'bigbang', title: 'Root', overview: '', content: '', mtime: 0 },
      { id: 'child', type: 'concept', title: 'Child', overview: 'An overview', content: '## Body\n\nSome text.', mtime: 0 },
    ],
    edges: [],
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(graphDataWithContent),
    }))
  })

  it('opens splash when clicking a node with content', async () => {
    render(<GraphPage kb={kbSplash} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-child'))
    fireEvent.click(screen.getByTestId('node-child'))
    expect(screen.getAllByText('Child').length).toBeGreaterThan(0)
    expect(document.querySelector('.node-splash-backdrop')).not.toBeNull()
  })

  it('does not open splash when clicking a node with empty content', async () => {
    render(<GraphPage kb={kbSplash} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-root'))
    fireEvent.click(screen.getByTestId('node-root'))
    expect(document.querySelector('.node-splash-backdrop')).toBeNull()
  })

  it('closes splash when clicking same node again', async () => {
    render(<GraphPage kb={kbSplash} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-child'))
    fireEvent.click(screen.getByTestId('node-child'))
    expect(document.querySelector('.node-splash-backdrop')).not.toBeNull()
    fireEvent.click(screen.getByTestId('node-child'))
    expect(document.querySelector('.node-splash-backdrop')).toBeNull()
  })

  it('panel still receives selectedNode regardless of content', async () => {
    render(<GraphPage kb={kbSplash} onBack={vi.fn()} />)
    await waitFor(() => screen.getByTestId('node-root'))
    fireEvent.click(screen.getByTestId('node-root'))
    // Panel shows node detail — panel-detail appears when selectedNode is set.
    // Root has no content so no splash, but panel should still update.
    expect(document.querySelector('.panel-detail')).not.toBeNull()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import GraphPage from './GraphPage'
import type { KbMeta, GraphData } from '../types'

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
})

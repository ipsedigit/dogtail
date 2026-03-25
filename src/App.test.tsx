import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

const mockManifest = {
  kbs: [{ slug: 'sample-kb', title: 'Sample KB', overview: 'A test', nodeCount: 4, updatedAt: 0 }]
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockManifest),
  }))
})

describe('App', () => {
  it('shows loading state initially', () => {
    render(<App />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows home page after manifest loads', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Sample KB')).toBeInTheDocument())
  })

  it('shows error when manifest fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(<App />)
    await waitFor(() => expect(screen.getByText(/build:graph/i)).toBeInTheDocument())
  })
})

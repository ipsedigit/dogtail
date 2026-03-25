import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomePage from './HomePage'
import type { Manifest } from '../types'

const manifest: Manifest = {
  kbs: [
    { slug: 'kb-one', title: 'KB One', overview: 'First KB', nodeCount: 10, updatedAt: 0 },
    { slug: 'kb-two', title: 'KB Two', overview: 'Second KB', nodeCount: 5, updatedAt: 0 },
  ]
}

describe('HomePage', () => {
  it('renders all KB cards', () => {
    render(<HomePage manifest={manifest} onSelect={vi.fn()} />)
    expect(screen.getByText('KB One')).toBeInTheDocument()
    expect(screen.getByText('KB Two')).toBeInTheDocument()
  })

  it('shows node count for each KB', () => {
    render(<HomePage manifest={manifest} onSelect={vi.fn()} />)
    expect(screen.getByText(/10 nodes/i)).toBeInTheDocument()
  })

  it('calls onSelect with the correct KB when a card is clicked', () => {
    const onSelect = vi.fn()
    render(<HomePage manifest={manifest} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('KB One'))
    expect(onSelect).toHaveBeenCalledWith(manifest.kbs[0])
  })
})

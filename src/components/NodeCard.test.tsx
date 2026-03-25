import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NodeCard from './NodeCard'

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom' },
}))

const props: { data: { id: string; type: string; title: string; overview: string; content: string; mtime: number; color: string }; selected: boolean } = {
  data: {
    id: 'tool-use',
    type: 'concept',
    title: 'Tool Use',
    overview: 'Calling external functions from an LLM',
    content: '',
    mtime: 0,
    color: '#7c3aed',
  },
  selected: false,
}

describe('NodeCard', () => {
  it('renders the title', () => {
    render(<NodeCard {...props} />)
    expect(screen.getByText('Tool Use')).toBeInTheDocument()
  })

  it('renders the type badge', () => {
    render(<NodeCard {...props} />)
    expect(screen.getByText(/concept/i)).toBeInTheDocument()
  })

  it('renders the overview', () => {
    render(<NodeCard {...props} />)
    expect(screen.getByText(/Calling external functions/i)).toBeInTheDocument()
  })
})

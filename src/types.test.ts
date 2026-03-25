import { describe, it, expectTypeOf } from 'vitest'
import type { GraphNode, GraphEdge, GraphData } from './types'

describe('GraphData types', () => {
  it('GraphNode has required fields', () => {
    expectTypeOf<GraphNode>().toHaveProperty('id')
    expectTypeOf<GraphNode>().toHaveProperty('type')
    expectTypeOf<GraphNode>().toHaveProperty('title')
    expectTypeOf<GraphNode>().toHaveProperty('overview')
    expectTypeOf<GraphNode>().toHaveProperty('content')
    expectTypeOf<GraphNode>().toHaveProperty('mtime')
  })

  it('GraphEdge has required fields', () => {
    expectTypeOf<GraphEdge>().toHaveProperty('id')
    expectTypeOf<GraphEdge>().toHaveProperty('source')
    expectTypeOf<GraphEdge>().toHaveProperty('target')
    expectTypeOf<GraphEdge>().toHaveProperty('type')
    expectTypeOf<GraphEdge>().toHaveProperty('label')
  })

  it('GraphData has nodes and edges', () => {
    expectTypeOf<GraphData>().toHaveProperty('nodes')
    expectTypeOf<GraphData>().toHaveProperty('edges')
  })
})

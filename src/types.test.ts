import { describe, it, expectTypeOf } from 'vitest'
import type { GraphNode, GraphEdge, GraphData, KbMeta, Manifest } from './types'

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

describe('KbMeta and Manifest types', () => {
  it('KbMeta has required fields', () => {
    expectTypeOf<KbMeta>().toHaveProperty('slug')
    expectTypeOf<KbMeta>().toHaveProperty('title')
    expectTypeOf<KbMeta>().toHaveProperty('overview')
    expectTypeOf<KbMeta>().toHaveProperty('nodeCount')
    expectTypeOf<KbMeta>().toHaveProperty('updatedAt')
  })

  it('Manifest has kbs array', () => {
    expectTypeOf<Manifest>().toHaveProperty('kbs')
  })
})

import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'url'
import path from 'path'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { buildKb } from './build-graph'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('buildKb', () => {
  it('parses a KB directory and returns GraphData', () => {
    const kbDir = path.resolve(__dirname, '../content/sample-kb')
    const result = buildKb(kbDir)
    expect(result.nodes.length).toBeGreaterThan(0)
    const bigbang = result.nodes.find(n => n.type === 'bigbang')
    expect(bigbang).toBeDefined()
    expect(bigbang?.title).toBe('Agentic Coding')
  })

  it('creates edges from frontmatter', () => {
    const kbDir = path.resolve(__dirname, '../content/sample-kb')
    const result = buildKb(kbDir)
    const edge = result.edges.find(e => e.label === 'requires')
    expect(edge).toBeDefined()
    expect(edge?.source).toBe('tool-use')
    expect(edge?.target).toBe('claude-code')
  })

  it('generates node ids from filenames', () => {
    const kbDir = path.resolve(__dirname, '../content/sample-kb')
    const result = buildKb(kbDir)
    const node = result.nodes.find(n => n.title === 'Tool Use')
    expect(node?.id).toBe('tool-use')
  })

  it('uses filename stem as node id, not the title', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'dogtail-test-'))
    writeFileSync(
      path.join(dir, 'my-file.md'),
      '---\ntype: concept\ntitle: My Different Title\noverview: test\n---\ncontent'
    )
    const result = buildKb(dir)
    expect(result.nodes[0].id).toBe('my-file')
  })

  it('includes bigbang → tool-use edge', () => {
    const kbDir = path.resolve(__dirname, '../content/sample-kb')
    const result = buildKb(kbDir)
    const edge = result.edges.find(e => e.source === 'bigbang' && e.target === 'tool-use')
    expect(edge).toBeDefined()
    expect(edge?.label).toBe('covers')
  })
})

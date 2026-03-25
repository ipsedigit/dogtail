import type { KbMeta, Manifest } from '../types'

interface Props {
  manifest: Manifest
  onSelect: (kb: KbMeta) => void
}

export default function HomePage({ manifest, onSelect }: Props) {
  return (
    <div className="home">
      <header className="home-header">
        <span className="home-logo">dogtail</span>
        <span className="home-tagline">knowledge graph explorer</span>
      </header>
      <main className="home-grid">
        {manifest.kbs.map(kb => (
          <button key={kb.slug} className="kb-card" onClick={() => onSelect(kb)}>
            <div className="kb-card-title">{kb.title}</div>
            <div className="kb-card-overview">{kb.overview}</div>
            <div className="kb-card-meta">{kb.nodeCount} nodes</div>
          </button>
        ))}
      </main>
    </div>
  )
}

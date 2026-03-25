import type { KbMeta, Manifest } from '../types'

interface Props { manifest: Manifest; onSelect: (kb: KbMeta) => void }

export default function HomePage({ manifest, onSelect }: Props) {
  return (
    <div>
      {manifest.kbs.map(kb => (
        <button key={kb.slug} onClick={() => onSelect(kb)}>{kb.title}</button>
      ))}
    </div>
  )
}

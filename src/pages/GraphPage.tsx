import type { KbMeta } from '../types'

interface Props { kb: KbMeta; onBack: () => void }

export default function GraphPage({ kb, onBack }: Props) {
  return <div><button onClick={onBack}>back</button><span>{kb.title}</span></div>
}

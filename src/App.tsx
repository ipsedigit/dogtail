import { useState, useEffect } from 'react'
import type { Manifest, KbMeta } from './types'
import HomePage from './pages/HomePage'
import GraphPage from './pages/GraphPage'

export default function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedKb, setSelectedKb] = useState<KbMeta | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/manifest.json')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setManifest)
      .catch(() => setError('Could not load manifest.json — run npm run build:graph first'))
  }, [])

  if (error) return <div className="error-screen">{error}</div>
  if (!manifest) return <div className="loading-screen">Loading...</div>
  if (selectedKb) return <GraphPage kb={selectedKb} onBack={() => setSelectedKb(null)} />
  return <HomePage manifest={manifest} onSelect={setSelectedKb} />
}

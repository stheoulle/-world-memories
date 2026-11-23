import type { LngLat } from 'maplibre-gl'
import { useState } from 'react'
import { Globe } from './globe/Globe'

/** Formats a coordinate as e.g. `48.8566° N, 2.3522° E` (spec §4.2). */
function formatLngLat({ lng, lat }: LngLat): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`
}

export default function App() {
  // Milestone 1 placeholder: shows the last clicked coordinate.
  // Replaced by pin creation in milestone 3.
  const [clicked, setClicked] = useState<LngLat | null>(null)

  return (
    <div className="app">
      <Globe onMapClick={setClicked} />
      <header className="app-header">
        <span className="app-title">🌍 World Memories</span>
      </header>
      {clicked && <div className="coord-readout">{formatLngLat(clicked.wrap())}</div>}
    </div>
  )
}

import { todayIso } from '../lib/format'
import type { Pin } from './types'

/** GeoJSON (RFC 7946): one Point feature per pin, coordinates as [longitude, latitude]. */
export function pinsToGeoJson(pins: Pin[]) {
  return {
    type: 'FeatureCollection' as const,
    features: pins.map((pin) => ({
      type: 'Feature' as const,
      id: pin.id,
      geometry: { type: 'Point' as const, coordinates: [pin.lng, pin.lat] },
      properties: {
        title: pin.title,
        emoji: pin.emoji,
        place: pin.place_name,
        date_start: pin.date_start,
        date_end: pin.date_end,
        comment: pin.comment,
        added_by: pin.author?.display_name ?? null,
        added_at: pin.created_at,
        edited_by: pin.updated_by ? (pin.editor?.display_name ?? null) : null,
        edited_at: pin.updated_by ? pin.updated_at : null,
      },
    })),
  }
}

/** Downloads the pins as `world-memories-YYYY-MM-DD.geojson`. */
export function downloadGeoJson(pins: Pin[]) {
  const json = JSON.stringify(pinsToGeoJson(pins), null, 2)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/geo+json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `world-memories-${todayIso()}.geojson`
  link.click()
  // Give the browser a moment to start the download before releasing the file.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

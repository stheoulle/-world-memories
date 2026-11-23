/**
 * Geocoding through Photon (https://photon.komoot.io), a free OpenStreetMap geocoder that,
 * unlike the public Nominatim server, allows search-as-you-type. Fair use: callers debounce
 * searches and only look up a place when a pin's location changes.
 */

const PHOTON_URL = 'https://photon.komoot.io'

/** Languages Photon can answer in; anything else falls back to local names. */
export type GeocodingLang = 'en' | 'fr'

/** Until the UI language setting exists (milestone 5), follow the browser. */
export function browserGeocodingLang(): GeocodingLang {
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

type PhotonProperties = {
  osm_type?: string
  osm_id?: number
  type?: string
  name?: string
  city?: string
  locality?: string
  district?: string
  county?: string
  state?: string
  country?: string
  /** [minLon, maxLat, maxLon, minLat] */
  extent?: [number, number, number, number]
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: PhotonProperties
}

async function photon(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<PhotonFeature[]> {
  const url = `${PHOTON_URL}${path}?${new URLSearchParams(params)}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Geocoding failed (${response.status})`)
  const body = (await response.json()) as { features?: PhotonFeature[] }
  return body.features ?? []
}

/**
 * The place name for a coordinate, at "City, Country" level (e.g. "Paris, France"),
 * or null when there is nothing there (e.g. in the middle of an ocean).
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  lang: GeocodingLang,
  signal?: AbortSignal,
): Promise<string | null> {
  const [feature] = await photon('/reverse', { lat: String(lat), lon: String(lng), lang, limit: '1' }, signal)
  if (!feature) return null
  const p = feature.properties
  const place = p.type === 'city' || p.type === 'country' ? p.name : (p.city ?? p.locality ?? p.county ?? p.state)
  const parts = [place, p.country].filter((part, i, all): part is string => !!part && all.indexOf(part) === i)
  return parts.length ? parts.join(', ') : null
}

export type PlaceResult = {
  id: string
  name: string
  /** e.g. "Kyoto Prefecture, Japan" */
  context: string
  lat: number
  lng: number
  /** [[west, south], [east, north]] when the place has an area. */
  bounds: [[number, number], [number, number]] | null
  /** Zoom to use when the place has no bounds. */
  zoom: number
}

const ZOOM_BY_TYPE: Record<string, number> = {
  house: 16,
  street: 15,
  locality: 13,
  district: 13,
  city: 11,
  county: 9,
  state: 7,
  country: 5,
}

/** Up to `limit` places matching a free-text query. */
export async function searchPlaces(
  query: string,
  lang: GeocodingLang,
  signal?: AbortSignal,
  limit = 5,
): Promise<PlaceResult[]> {
  // Ask for more than needed: Photon often returns near-duplicates (e.g. several stations of one city).
  const features = await photon('/api/', { q: query, lang, limit: String(limit * 3) }, signal)

  const seen = new Set<string>()
  const results: PlaceResult[] = []
  for (const { geometry, properties: p } of features) {
    if (!p.name) continue
    const contextParts = [p.city, p.state, p.country].filter(
      (part, i, all): part is string => !!part && part !== p.name && all.indexOf(part) === i,
    )
    const context = contextParts.join(', ')
    const key = `${p.name}|${context}`
    if (seen.has(key)) continue
    seen.add(key)

    const [lng, lat] = geometry.coordinates
    const e = p.extent
    results.push({
      id: `${p.osm_type}${p.osm_id}`,
      name: p.name,
      context,
      lat,
      lng,
      bounds: e ? [[e[0], e[3]], [e[2], e[1]]] : null,
      zoom: ZOOM_BY_TYPE[p.type ?? ''] ?? 12,
    })
    if (results.length === limit) break
  }
  return results
}

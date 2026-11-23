import { Map as MapLibreMap, NavigationControl, setWorkerUrl, type ExpressionSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef, useState } from 'react'
import type { Lang } from '../i18n/context'

// MapLibre v6 looks for its worker next to its own module file, which does not exist once
// Vite has bundled it. Ship the (self-contained) worker as an asset and point MapLibre at it.
setWorkerUrl(maplibreWorkerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

/** Default view when there is nothing to center on (spec §4.1). */
const DEFAULT_CENTER: [number, number] = [0, 20]
const DEFAULT_ZOOM = 1.6

/** Auto-rotation speed, in degrees of longitude per second. */
const ROTATION_SPEED = 4

type GlobeProps = {
  /** Receives the map instance once it is created, and null when it is destroyed. */
  onMapReady?: (map: MapLibreMap | null) => void
  /** Slowly spin the globe until the user interacts with it. */
  autoRotate?: boolean
  /** Language of the map labels; places without a name in it keep the style's default. */
  lang: Lang
}

/** The style's own label expressions, by layer id, captured before they are localized. */
type LabelFields = Map<string, ExpressionSpecification>

/** Shows `name:<lang>` where the map data has it, else the style's original label. */
function localizeLabels(map: MapLibreMap, originals: LabelFields, lang: Lang) {
  for (const [layerId, original] of originals) {
    map.setLayoutProperty(layerId, 'text-field', ['coalesce', ['get', `name:${lang}`], original])
  }
}

/** Collects the label layers that show a place name (not e.g. road numbers). */
function captureLabelFields(map: MapLibreMap): LabelFields {
  const originals: LabelFields = new Map()
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    const field = map.getLayoutProperty(layer.id, 'text-field') as unknown
    if (Array.isArray(field) && JSON.stringify(field).includes('"name')) {
      originals.set(layer.id, field as ExpressionSpecification)
    }
  }
  return originals
}

export function Globe({ onMapReady, autoRotate = false, lang }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [labelFields, setLabelFields] = useState<LabelFields | null>(null)

  // Keep the latest callback in a ref so the map is created only once.
  const onMapReadyRef = useRef(onMapReady)
  useEffect(() => {
    onMapReadyRef.current = onMapReady
  })

  useEffect(() => {
    if (!containerRef.current) return

    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    })

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')

    map.on('style.load', () => {
      map.setProjection({ type: 'globe' })
      // Atmosphere glow around the globe, fading out as we zoom in.
      map.setSky({
        'sky-color': '#0b1a33',
        'horizon-color': '#7fb4ff',
        'fog-color': '#ffffff',
        'sky-horizon-blend': 0.5,
        'horizon-fog-blend': 0.6,
        'fog-ground-blend': 0.9,
        'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
      })
      setLabelFields(captureLabelFields(map))
    })

    setMap(map)
    onMapReadyRef.current?.(map)

    return () => {
      setMap(null)
      onMapReadyRef.current?.(null)
      map.remove()
    }
  }, [])

  useEffect(() => {
    if (map && labelFields) localizeLabels(map, labelFields, lang)
  }, [map, labelFields, lang])

  useEffect(() => {
    if (!map || !autoRotate) return

    let frame = 0
    let last = performance.now()
    let stopped = false
    const stop = () => {
      stopped = true
      cancelAnimationFrame(frame)
    }

    const spin = (now: number) => {
      if (stopped) return
      const dt = (now - last) / 1000
      last = now
      const center = map.getCenter()
      map.jumpTo({ center: [center.lng + ROTATION_SPEED * dt, center.lat] })
      frame = requestAnimationFrame(spin)
    }
    frame = requestAnimationFrame(spin)

    // Any user gesture stops the rotation for good.
    const canvas = map.getCanvasContainer()
    const events = ['mousedown', 'touchstart', 'wheel'] as const
    events.forEach((type) => canvas.addEventListener(type, stop, { passive: true }))

    return () => {
      stop()
      events.forEach((type) => canvas.removeEventListener(type, stop))
    }
  }, [map, autoRotate])

  return <div ref={containerRef} className="globe" />
}

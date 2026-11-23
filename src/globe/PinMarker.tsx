import { Marker, type LngLat, type Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useRef } from 'react'

type PinMarkerProps = {
  map: MapLibreMap
  lat: number
  lng: number
  emoji: string
  /** Accessible name of the marker button. */
  label: string
  selected?: boolean
  /** The pin being created or edited: highlighted and draggable. */
  draft?: boolean
  onClick?: () => void
  onDragEnd?: (lngLat: LngLat) => void
}

/** An emoji marker on the globe. Hidden when it is on the far side of the globe. */
export function PinMarker({ map, lat, lng, emoji, label, selected, draft, onClick, onDragEnd }: PinMarkerProps) {
  const markerRef = useRef<Marker | null>(null)
  const onClickRef = useRef(onClick)
  const onDragEndRef = useRef(onDragEnd)
  useEffect(() => {
    onClickRef.current = onClick
    onDragEndRef.current = onDragEnd
  })

  // Create the marker once; the props below are applied by the following effects.
  useEffect(() => {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'pin-marker'
    const bubble = document.createElement('span')
    bubble.className = 'pin-marker-bubble'
    element.append(bubble)

    // Without stopPropagation the map would also see the click and start a new pin.
    element.addEventListener('click', (e) => {
      e.stopPropagation()
      onClickRef.current?.()
    })

    const marker = new Marker({ element, anchor: 'bottom', opacityWhenCovered: 0 })
      .setLngLat([0, 0])
      .addTo(map)
    marker.on('dragend', () => onDragEndRef.current?.(marker.getLngLat()))
    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
  }, [map])

  useEffect(() => {
    markerRef.current?.setLngLat([lng, lat])
  }, [lng, lat])

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    const element = marker.getElement()
    element.querySelector('.pin-marker-bubble')!.textContent = emoji
    element.setAttribute('aria-label', label)
    element.title = label
    element.classList.toggle('is-selected', !!selected)
    element.classList.toggle('is-draft', !!draft)
    marker.setDraggable(!!draft)
  }, [emoji, label, selected, draft])

  return null
}

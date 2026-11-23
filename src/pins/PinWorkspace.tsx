import type { LngLat, LngLatLike, Map as MapLibreMap } from 'maplibre-gl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PinMarker } from '../globe/PinMarker'
import { todayIso } from '../lib/format'
import { PinCard } from './PinCard'
import { PinForm } from './PinForm'
import { DEFAULT_EMOJI, type Pin, type PinInput } from './types'
import { usePins } from './usePins'

type Mode =
  | { kind: 'idle' }
  | { kind: 'viewing'; pinId: string }
  /** Creating (`pinId: null`) or editing a pin. `picking`: the next map click sets the location. */
  | { kind: 'editing'; pinId: string | null; draft: PinInput; initial: PinInput; picking: boolean }

const MOBILE_BREAKPOINT = 640
/** Width of the desktop side panel including its margins, see `.panel` in index.css. */
const PANEL_WIDTH = 404
/** Share of the screen height the mobile bottom sheet may cover. */
const SHEET_RATIO = 0.6

function toInput(pin: Pin): PinInput {
  const { lat, lng, place_name, emoji, title, comment, date_start, date_end } = pin
  return { lat, lng, place_name, emoji, title, comment, date_start, date_end }
}

/** Trims text and stores empty optional fields as null. */
function normalize(draft: PinInput): PinInput {
  return {
    ...draft,
    title: draft.title.trim(),
    place_name: draft.place_name?.trim() || null,
    comment: draft.comment?.trim() || null,
    date_end: draft.date_end || null,
  }
}

function hasChanges(mode: Mode): boolean {
  if (mode.kind !== 'editing') return false
  const a = normalize(mode.draft)
  const b = normalize(mode.initial)
  const fields: (keyof PinInput)[] = ['place_name', 'emoji', 'title', 'comment', 'date_start', 'date_end']
  // Moving a pin that is not saved yet is not worth a confirmation; moving a saved one is.
  if (mode.pinId) fields.push('lat', 'lng')
  return fields.some((f) => a[f] !== b[f])
}

/** Screen-space offset that keeps a point clear of the panel when centering on it. */
function panelOffset(map: MapLibreMap): [number, number] {
  const { clientWidth, clientHeight } = map.getContainer()
  return clientWidth < MOBILE_BREAKPOINT ? [0, (-clientHeight * SHEET_RATIO) / 2] : [-PANEL_WIDTH / 2, 0]
}

/** Pans so that the point is not hidden under the panel, if needed. */
function revealPoint(map: MapLibreMap, lngLat: LngLatLike) {
  const { clientWidth, clientHeight } = map.getContainer()
  const point = map.project(lngLat)
  const mobile = clientWidth < MOBILE_BREAKPOINT
  const hidden = mobile ? point.y > clientHeight * (1 - SHEET_RATIO) : point.x > clientWidth - PANEL_WIDTH
  if (hidden) map.easeTo({ center: lngLat, offset: panelOffset(map) })
}

/** Pins on the globe plus the create / view / edit / delete flows (milestone 3). */
export function PinWorkspace({ map }: { map: MapLibreMap }) {
  const { load, pins, create, update, remove } = usePins()
  const [mode, setMode] = useState<Mode>({ kind: 'idle' })

  const dirty = hasChanges(mode)
  const confirmDiscard = useCallback(() => !dirty || window.confirm('Discard your unsaved changes?'), [dirty])

  // Initial view: centered on the most recent pin (spec §4.1).
  const centeredRef = useRef(false)
  useEffect(() => {
    if (load.status !== 'ready' || centeredRef.current) return
    centeredRef.current = true
    const latest = pins[0]
    if (latest) map.easeTo({ center: [latest.lng, latest.lat], duration: 1500 })
  }, [load.status, pins, map])

  // ----- Actions -----

  const startCreating = (lngLat: LngLat) => {
    const { lng, lat } = lngLat.wrap()
    const draft: PinInput = {
      lat,
      lng,
      place_name: '',
      emoji: DEFAULT_EMOJI,
      title: '',
      comment: '',
      date_start: todayIso(),
      date_end: null,
    }
    setMode({ kind: 'editing', pinId: null, draft, initial: draft, picking: false })
    revealPoint(map, [lng, lat])
  }

  const view = (pin: Pin) => {
    if (!confirmDiscard()) return
    setMode({ kind: 'viewing', pinId: pin.id })
    revealPoint(map, [pin.lng, pin.lat])
  }

  const cancel = useCallback(() => {
    if (mode.kind === 'editing') {
      if (!confirmDiscard()) return
      setMode(mode.pinId ? { kind: 'viewing', pinId: mode.pinId } : { kind: 'idle' })
    } else {
      setMode({ kind: 'idle' })
    }
  }, [mode, confirmDiscard])

  const patchDraft = (patch: Partial<PinInput>) =>
    setMode((m) => (m.kind === 'editing' ? { ...m, draft: { ...m.draft, ...patch } } : m))

  const moveDraft = (lngLat: LngLat) => {
    const { lng, lat } = lngLat.wrap()
    setMode((m) => (m.kind === 'editing' ? { ...m, draft: { ...m.draft, lat, lng }, picking: false } : m))
  }

  const save = async () => {
    if (mode.kind !== 'editing') return
    const input = normalize(mode.draft)
    const saved = mode.pinId ? await update(mode.pinId, input) : await create(input)
    setMode({ kind: 'viewing', pinId: saved.id })
  }

  const flyTo = (pin: Pin) =>
    map.flyTo({ center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), 5), offset: panelOffset(map) })

  // ----- Map interaction -----

  // A click on the map starts a new pin, or sets the location of the one being edited.
  // MapLibre does not fire `click` after a drag, so rotating the globe never creates a pin.
  const handleMapClick = (lngLat: LngLat) => {
    if (mode.kind === 'editing') {
      // While creating, a click simply moves the new pin; an existing pin moves only via "Move".
      if (mode.picking || mode.pinId === null) moveDraft(lngLat)
      return
    }
    startCreating(lngLat)
  }
  const handleMapClickRef = useRef(handleMapClick)
  useEffect(() => {
    handleMapClickRef.current = handleMapClick
  })
  useEffect(() => {
    const onClick = (e: { lngLat: LngLat }) => handleMapClickRef.current(e.lngLat)
    map.on('click', onClick)
    return () => {
      map.off('click', onClick)
    }
  }, [map])

  const picking = mode.kind === 'editing' && mode.picking
  useEffect(() => {
    map.getCanvas().style.cursor = picking ? 'crosshair' : ''
  }, [map, picking])

  // Esc cancels the form or closes the card.
  useEffect(() => {
    if (mode.kind === 'idle') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode.kind, cancel])

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // ----- Render -----

  const editingId = mode.kind === 'editing' ? mode.pinId : null
  const viewedPin = mode.kind === 'viewing' ? pins.find((p) => p.id === mode.pinId) : undefined

  return (
    <>
      {pins
        .filter((pin) => pin.id !== editingId)
        .map((pin) => (
          <PinMarker
            key={pin.id}
            map={map}
            lat={pin.lat}
            lng={pin.lng}
            emoji={pin.emoji}
            label={pin.title}
            selected={pin.id === viewedPin?.id}
            onClick={() => view(pin)}
          />
        ))}

      {mode.kind === 'editing' && (
        <>
          <PinMarker
            key="draft"
            map={map}
            lat={mode.draft.lat}
            lng={mode.draft.lng}
            emoji={mode.draft.emoji}
            label={mode.draft.title || 'New pin'}
            draft
            onDragEnd={moveDraft}
          />
          <PinForm
            key={mode.pinId ?? 'new'}
            draft={mode.draft}
            isNew={mode.pinId === null}
            picking={mode.picking}
            onChange={patchDraft}
            onTogglePicking={() => setMode({ ...mode, picking: !mode.picking })}
            onSubmit={save}
            onCancel={cancel}
          />
        </>
      )}

      {viewedPin && (
        <PinCard
          key={viewedPin.id}
          pin={viewedPin}
          onClose={cancel}
          onEdit={() =>
            setMode({
              kind: 'editing',
              pinId: viewedPin.id,
              draft: toInput(viewedPin),
              initial: toInput(viewedPin),
              picking: false,
            })
          }
          onFlyTo={() => flyTo(viewedPin)}
          onDelete={async () => {
            await remove(viewedPin.id)
            setMode({ kind: 'idle' })
          }}
        />
      )}

      {load.status === 'error' && <div className="toast toast-error">Could not load pins: {load.message}</div>}
    </>
  )
}

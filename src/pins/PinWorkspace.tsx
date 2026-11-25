import type { LngLat, Map as MapLibreMap } from 'maplibre-gl'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Profile } from '../auth/useProfile'
import { UserMenu } from '../auth/UserMenu'
import { PinMarker } from '../globe/PinMarker'
import { todayIso } from '../lib/format'
import { reverseGeocode, type PlaceResult } from '../lib/geocoding'
import { PlaceSearch } from '../sidebar/PlaceSearch'
import { Sidebar } from '../sidebar/Sidebar'
import { PinCard } from './PinCard'
import { PinForm } from './PinForm'
import { DEFAULT_EMOJI, type Pin, type PinInput } from './types'
import { usePins } from './usePins'
import { useI18n } from '../i18n/context'
import { Logo } from '../ui/Logo'
import { MenuIcon } from '../ui/icons'

type EditingMode = {
  kind: 'editing'
  /** null while creating a new pin. */
  pinId: string | null
  draft: PinInput
  initial: PinInput
  /** The next map click sets the location. */
  picking: boolean
  /** Identifies this form session, so a late place lookup cannot land in another one. */
  session: number
  /** Last place name filled in automatically; replaced on the next lookup unless the user edited it. */
  autoPlace: string | null
}

type Mode = { kind: 'idle' } | { kind: 'viewing'; pinId: string } | EditingMode

const MOBILE_BREAKPOINT = 640
/** Desktop side panel and sidebar widths including margins, see `.panel` / `.sidebar` in index.css. */
const PANEL_WIDTH = 404
const SIDEBAR_WIDTH = 344
/** Share of the screen height the mobile bottom sheet may cover. */
const SHEET_RATIO = 0.6
/** Zoom when going to a pin: between city and street level. Deeper zooms are kept. */
const PIN_ZOOM = 14

const isMobile = (map: MapLibreMap) => map.getContainer().clientWidth < MOBILE_BREAKPOINT

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
  const draft = normalize(mode.draft)
  const initial = normalize(mode.initial)
  const fields: (keyof PinInput)[] = ['emoji', 'title', 'comment', 'date_start', 'date_end']
  if (mode.pinId) {
    // Moving a saved pin is worth a confirmation, so is any change to its place.
    fields.push('lat', 'lng', 'place_name')
  } else if ((mode.draft.place_name ?? '') !== (mode.autoPlace ?? '')) {
    // On a new pin, only a place the user typed counts; the looked-up one does not.
    fields.push('place_name')
  }
  return fields.some((f) => draft[f] !== initial[f])
}

/** Parts of the screen covered by the sidebar and the pin panel. */
type Insets = { left: number; right: number; bottom: number }

/** Pins, sidebar, place search, and the create / view / edit / delete flows. */
export function PinWorkspace({ map, profile }: { map: MapLibreMap; profile: Profile }) {
  const { t, lang } = useI18n()
  const { load, pins, create, update, remove } = usePins()
  const [mode, setMode] = useState<Mode>({ kind: 'idle' })
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile(map))

  const dirty = hasChanges(mode)
  const confirmDiscard = useCallback(() => !dirty || window.confirm(t.discardChanges), [dirty, t])

  // ----- Camera helpers -----

  const insets = (withPanel: boolean): Insets => {
    const { clientHeight } = map.getContainer()
    if (isMobile(map)) return { left: 0, right: 0, bottom: withPanel ? clientHeight * SHEET_RATIO : 0 }
    return { left: sidebarOpen ? SIDEBAR_WIDTH : 0, right: withPanel ? PANEL_WIDTH : 0, bottom: 0 }
  }

  /** Screen offset that centers a point in the part of the map left visible. */
  const offsetFor = ({ left, right, bottom }: Insets): [number, number] => [(left - right) / 2, -bottom / 2]

  /** Pans so the point is not hidden under the sidebar or the panel, if needed. */
  const revealPoint = (lng: number, lat: number) => {
    const visible = insets(true)
    const { clientWidth, clientHeight } = map.getContainer()
    const p = map.project([lng, lat])
    const hidden = p.x < visible.left || p.x > clientWidth - visible.right || p.y > clientHeight - visible.bottom
    if (hidden) map.easeTo({ center: [lng, lat], offset: offsetFor(visible) })
  }

  const flyToPin = (pin: Pin) =>
    map.flyTo({ center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), PIN_ZOOM), offset: offsetFor(insets(true)) })

  const flyToPlace = (place: PlaceResult) => {
    const { left, right, bottom } = insets(false)
    if (place.bounds) {
      map.fitBounds(place.bounds, {
        padding: { top: 100, left: left + 40, right: right + 40, bottom: bottom + 40 },
        maxZoom: 14,
      })
    } else {
      map.flyTo({ center: [place.lng, place.lat], zoom: place.zoom, offset: offsetFor({ left, right, bottom }) })
    }
  }

  // Initial view: centered on the most recent pin (spec §4.1).
  const centeredRef = useRef(false)
  useEffect(() => {
    if (load.status !== 'ready' || centeredRef.current) return
    centeredRef.current = true
    const latest = pins[0]
    if (latest) map.easeTo({ center: [latest.lng, latest.lat], duration: 1500 })
  }, [load.status, pins, map])

  // ----- Place lookup (reverse geocoding) -----

  const sessionRef = useRef(0)
  const lookupRef = useRef<AbortController | null>(null)
  const [lookingUp, setLookingUp] = useState(false)

  /**
   * Fills the place name from the coordinates. Unless `force`, a name the user typed is kept:
   * only an empty field or a previously looked-up name is replaced.
   */
  const lookUpPlace = (session: number, lat: number, lng: number, force: boolean) => {
    lookupRef.current?.abort()
    const controller = new AbortController()
    lookupRef.current = controller
    setLookingUp(true)
    reverseGeocode(lat, lng, lang, controller.signal)
      .then((name) => {
        setMode((m) => {
          if (m.kind !== 'editing' || m.session !== session) return m
          const current = m.draft.place_name ?? ''
          const replaceable = force || !current.trim() || current === m.autoPlace
          if (!replaceable) return m
          return { ...m, draft: { ...m.draft, place_name: name ?? '' }, autoPlace: name ?? '' }
        })
      })
      .catch(() => {
        // Lookup is a convenience: on failure the field simply stays as it is.
      })
      .finally(() => {
        if (lookupRef.current === controller) {
          lookupRef.current = null
          setLookingUp(false)
        }
      })
  }

  const stopLookup = () => {
    lookupRef.current?.abort()
    lookupRef.current = null
    setLookingUp(false)
  }

  // ----- Actions -----

  const startEditing = (pinId: string | null, draft: PinInput) => {
    stopLookup()
    const session = ++sessionRef.current
    setMode({ kind: 'editing', pinId, draft, initial: draft, picking: false, session, autoPlace: null })
    return session
  }

  const startCreating = (lngLat: LngLat) => {
    const { lng, lat } = lngLat.wrap()
    const session = startEditing(null, {
      lat,
      lng,
      place_name: '',
      emoji: DEFAULT_EMOJI,
      title: '',
      comment: '',
      date_start: todayIso(),
      date_end: null,
    })
    lookUpPlace(session, lat, lng, false)
    revealPoint(lng, lat)
  }

  const view = (pin: Pin) => {
    if (!confirmDiscard()) return false
    stopLookup()
    setMode({ kind: 'viewing', pinId: pin.id })
    return true
  }

  const cancel = useCallback(() => {
    if (mode.kind === 'editing') {
      if (!confirmDiscard()) return
      lookupRef.current?.abort()
      setMode(mode.pinId ? { kind: 'viewing', pinId: mode.pinId } : { kind: 'idle' })
    } else {
      setMode({ kind: 'idle' })
    }
  }, [mode, confirmDiscard])

  const patchDraft = (patch: Partial<PinInput>) =>
    setMode((m) => (m.kind === 'editing' ? { ...m, draft: { ...m.draft, ...patch } } : m))

  const moveDraft = (lngLat: LngLat) => {
    if (mode.kind !== 'editing') return
    const { lng, lat } = lngLat.wrap()
    setMode({ ...mode, draft: { ...mode.draft, lat, lng }, picking: false })
    lookUpPlace(mode.session, lat, lng, false)
  }

  const save = async () => {
    if (mode.kind !== 'editing') return
    stopLookup()
    const input = normalize(mode.draft)
    const saved = mode.pinId ? await update(mode.pinId, input) : await create(input)
    setMode({ kind: 'viewing', pinId: saved.id })
  }

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
  const selectedId = viewedPin?.id ?? editingId

  return (
    <>
      <div className="topbar">
        <div className="toolbar">
          <button
            className="btn-icon toolbar-toggle"
            aria-label={sidebarOpen ? t.hideList : t.showList}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <MenuIcon />
          </button>
          <span className="app-title">
            <Logo size={22} />
            <span className="app-title-text">{t.appName}</span>
          </span>
        </div>
        <PlaceSearch onSelect={flyToPlace} />
        <UserMenu profile={profile} />
      </div>

      {sidebarOpen && (
        <>
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
          <Sidebar
            pins={pins}
            loading={load.status === 'loading'}
            selectedId={selectedId}
            onClose={() => setSidebarOpen(false)}
            onSelect={(pin) => {
              if (!view(pin)) return
              if (isMobile(map)) setSidebarOpen(false)
              flyToPin(pin)
            }}
          />
        </>
      )}

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
            onClick={() => {
              if (view(pin)) flyToPin(pin)
            }}
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
            label={mode.draft.title || t.newPin}
            draft
            onDragEnd={moveDraft}
          />
          <PinForm
            key={mode.session}
            draft={mode.draft}
            isNew={mode.pinId === null}
            picking={mode.picking}
            lookingUp={lookingUp}
            onChange={patchDraft}
            onTogglePicking={() => setMode({ ...mode, picking: !mode.picking })}
            onLookUpPlace={() => lookUpPlace(mode.session, mode.draft.lat, mode.draft.lng, true)}
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
          onEdit={() => startEditing(viewedPin.id, toInput(viewedPin))}
          onFlyTo={() => flyToPin(viewedPin)}
          onDelete={async () => {
            await remove(viewedPin.id)
            setMode({ kind: 'idle' })
          }}
        />
      )}

      {load.status === 'error' && <div className="toast toast-error">{t.couldNotLoadPins(load.message)}</div>}
    </>
  )
}

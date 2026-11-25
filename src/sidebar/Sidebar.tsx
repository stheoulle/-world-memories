import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDateRange } from '../lib/format'
import { normalizeForSearch } from '../lib/text'
import type { Pin } from '../pins/types'
import { useI18n } from '../i18n/context'
import { CloseIcon, DownloadIcon } from '../ui/icons'
import { downloadGeoJson } from '../pins/geojson'

type SidebarProps = {
  pins: Pin[]
  loading: boolean
  selectedId: string | null
  onSelect: (pin: Pin) => void
  onClose: () => void
}

function matches(pin: Pin, query: string): boolean {
  const haystack = [pin.title, pin.comment, pin.place_name, pin.author?.display_name].filter(Boolean).join('\n')
  return normalizeForSearch(haystack).includes(query)
}

/** List of all pins, newest first, with a text filter (spec §4.4). */
export function Sidebar({ pins, loading, selectedId, onSelect, onClose }: SidebarProps) {
  const { t, lang } = useI18n()
  const [filter, setFilter] = useState('')
  const query = normalizeForSearch(filter.trim())
  const visible = useMemo(() => (query ? pins.filter((pin) => matches(pin, query)) : pins), [pins, query])

  // Keep the selected pin in view, e.g. after clicking its marker on the globe.
  const listRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    if (!selectedId) return
    listRef.current
      ?.querySelector(`[data-pin-id="${CSS.escape(selectedId)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  const count = query ? t.pinCountFiltered(visible.length, pins.length) : t.pinCount(pins.length)

  return (
    <nav className="sidebar" aria-label={t.pinsLabel}>
      <div className="sidebar-header">
        <input
          type="search"
          className="sidebar-filter"
          aria-label={t.filterPinsLabel}
          placeholder={t.filterPins}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && filter) {
              e.stopPropagation()
              setFilter('')
            }
          }}
        />
        <button className="btn-icon sidebar-close" aria-label={t.closeList} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="sidebar-count-row">
        <p className="sidebar-count">{loading ? t.loadingPins : count}</p>
        {/* Exports what the list shows: every pin, or only the matches while filtering. */}
        <button
          className="sidebar-export"
          title={t.exportTitle}
          disabled={loading || visible.length === 0}
          onClick={() => downloadGeoJson(visible)}
        >
          <DownloadIcon />
          {t.exportGeoJson}
        </button>
      </div>

      <ul className="sidebar-list" ref={listRef}>
        {visible.map((pin) => (
          <li key={pin.id}>
            <button
              className={`sidebar-item${pin.id === selectedId ? ' is-selected' : ''}`}
              data-pin-id={pin.id}
              aria-current={pin.id === selectedId || undefined}
              onClick={() => onSelect(pin)}
            >
              <span className="sidebar-item-emoji" aria-hidden>
                {pin.emoji}
              </span>
              <span className="sidebar-item-text">
                <span className="sidebar-item-title">{pin.title}</span>
                {pin.place_name && <span className="sidebar-item-sub">{pin.place_name}</span>}
                <span className="sidebar-item-sub">{formatDateRange(pin.date_start, pin.date_end, lang)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {!loading && pins.length === 0 && (
        <p className="sidebar-empty">{t.noPinsYet}</p>
      )}
      {!loading && pins.length > 0 && visible.length === 0 && (
        <p className="sidebar-empty">{t.noMatch(filter.trim())}</p>
      )}
    </nav>
  )
}

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { searchPlaces, type PlaceResult } from '../lib/geocoding'
import { useI18n } from '../i18n/context'

/** Spec §4.5: at least 500 ms between keystrokes and a request. */
const DEBOUNCE_MS = 500
const MIN_LENGTH = 3

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; results: PlaceResult[] }
  | { status: 'error' }

/** Search box that finds a place by name and flies the globe there (spec §4.5). */
export function PlaceSearch({ onSelect }: { onSelect: (place: PlaceResult) => void }) {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<SearchState>({ status: 'idle' })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  /** Name of the last chosen place, put back in the input; no need to search for it again. */
  const [chosen, setChosen] = useState<string | null>(null)
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed.length < MIN_LENGTH || trimmed === chosen) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setSearch({ status: 'loading' })
      searchPlaces(trimmed, lang, controller.signal)
        .then((results) => {
          setSearch({ status: 'done', results })
          setActive(0)
        })
        .catch((err: unknown) => {
          if ((err as Error).name !== 'AbortError') setSearch({ status: 'error' })
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, chosen, lang])

  // Close the result list on a click outside.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const results = trimmed.length >= MIN_LENGTH && search.status === 'done' ? search.results : []
  const showList = open && trimmed.length >= MIN_LENGTH && search.status !== 'idle'

  function choose(place: PlaceResult) {
    onSelect(place)
    setOpen(false)
    setChosen(place.name.trim())
    setQuery(place.name)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      // Handle it here so it does not also close an open pin card, and so the browser's
      // own "Esc clears a search field" does not wipe the text when only closing the list.
      e.stopPropagation()
      e.preventDefault()
      if (open) setOpen(false)
      else setQuery('')
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      // The first ↓ only reopens the list; the next ones move through it.
      if (open) setActive((i) => (i + 1) % results.length)
      else setOpen(true)
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      choose(results[active])
    }
  }

  return (
    <div className="place-search" ref={rootRef}>
      <span className="place-search-icon" aria-hidden>
        🔍
      </span>
      <input
        type="search"
        role="combobox"
        aria-label={t.searchPlaceLabel}
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        placeholder={t.searchPlace}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <ul className="place-search-results" id={listId} role="listbox">
          {search.status === 'loading' && <li className="place-search-message">{t.searching}</li>}
          {search.status === 'error' && <li className="place-search-message">{t.searchUnavailable}</li>}
          {search.status === 'done' && results.length === 0 && (
            <li className="place-search-message">{t.noPlaceFound}</li>
          )}
          {results.map((place, i) => (
            <li
              key={place.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className="place-search-result"
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(place)}
            >
              <span className="place-search-name">{place.name}</span>
              {place.context && <span className="place-search-context">{place.context}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

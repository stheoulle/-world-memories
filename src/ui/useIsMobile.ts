import { useSyncExternalStore } from 'react'

/** Keep in sync with the `max-width: 639px` media queries in index.css. */
const QUERY = '(max-width: 639px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** True on phone-sized screens, updated live when the window is resized or rotated. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches)
}

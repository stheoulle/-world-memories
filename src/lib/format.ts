import type { Lang } from '../i18n/context'

/** Formats a coordinate as e.g. `48.8566° N, 2.3522° E` (spec §4.2). */
export function formatLatLng(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`
}

/** Today's date in the user's time zone, as `YYYY-MM-DD`. */
export function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** `YYYY-MM-DD` → Date at UTC midnight, formatted in UTC so the day never shifts. */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** e.g. "May 1 – 4, 2025" / "1–4 mai 2025". */
export function formatDateRange(start: string, end: string | null, lang: Lang): string {
  const fmt = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' })
  if (!end || end === start) return fmt.format(parseIsoDate(start))
  return fmt.formatRange(parseIsoDate(start), parseIsoDate(end))
}

/** A timestamp (e.g. `updated_at`) as a localized date. */
export function formatTimestamp(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(iso))
}

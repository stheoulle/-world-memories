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

const dayFormat = () => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })

/** e.g. "Mar 12, 2024" or "Mar 12 – 18, 2024" (localized). */
export function formatDateRange(start: string, end: string | null): string {
  const fmt = dayFormat()
  if (!end || end === start) return fmt.format(parseIsoDate(start))
  return fmt.formatRange(parseIsoDate(start), parseIsoDate(end))
}

/** A timestamp (e.g. `updated_at`) as a localized date. */
export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso))
}

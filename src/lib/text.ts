/** Lowercases and strips accents, so "Ile" matches "Île" (spec §4.4). */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

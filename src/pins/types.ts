/** A row of `public.pins` (spec §5), with the author and last editor names embedded. */
export type Pin = {
  id: string
  lat: number
  lng: number
  place_name: string | null
  emoji: string
  title: string
  comment: string | null
  /** `YYYY-MM-DD` */
  date_start: string
  /** `YYYY-MM-DD`, ≥ date_start */
  date_end: string | null
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string
  author: { display_name: string } | null
  editor: { display_name: string } | null
}

/** The fields a member edits. Audit columns are set by the database. */
export type PinInput = Pick<
  Pin,
  'lat' | 'lng' | 'place_name' | 'emoji' | 'title' | 'comment' | 'date_start' | 'date_end'
>

export const DEFAULT_EMOJI = '📍'
export const TITLE_MAX = 100
export const COMMENT_MAX = 2000
export const PLACE_MAX = 200

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Pin, PinInput } from './types'

/** Every pin column, plus the author's and last editor's display names. */
const PIN_SELECT =
  '*, author:profiles!pins_created_by_fkey(display_name), editor:profiles!pins_updated_by_fkey(display_name)'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }

/** Newest trip first; ties broken by creation time. */
function byDateDesc(a: Pin, b: Pin): number {
  return b.date_start.localeCompare(a.date_start) || b.created_at.localeCompare(a.created_at)
}

/**
 * Loads all pins once (spec §4.7: a few hundred at most) and exposes create/update/remove.
 * The mutations throw on failure so the caller can show the error where it happened.
 */
export function usePins() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [pins, setPins] = useState<Pin[]>([])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('pins')
      .select(PIN_SELECT)
      .returns<Pin[]>()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setLoad({ status: 'error', message: error.message })
        } else {
          setPins(data)
          setLoad({ status: 'ready' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const create = useCallback(async (input: PinInput): Promise<Pin> => {
    const { data, error } = await supabase.from('pins').insert(input).select(PIN_SELECT).single<Pin>()
    if (error) throw new Error(error.message)
    setPins((prev) => [...prev, data])
    return data
  }, [])

  const update = useCallback(async (id: string, input: PinInput): Promise<Pin> => {
    const { data, error } = await supabase
      .from('pins')
      .update(input)
      .eq('id', id)
      .select(PIN_SELECT)
      .single<Pin>()
    if (error) throw new Error(error.message)
    setPins((prev) => prev.map((p) => (p.id === id ? data : p)))
    return data
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('pins').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setPins((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const sorted = useMemo(() => [...pins].sort(byDateDesc), [pins])

  return { load, pins: sorted, create, update, remove }
}

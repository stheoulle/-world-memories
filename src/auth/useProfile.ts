import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Profile = {
  id: string
  display_name: string
}

type ProfileState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: Profile | null }

/**
 * Loads the profile of the given user; `profile: null` means it has not been created yet.
 * Callers remount (key) on user change, so `userId` is fixed for the hook's lifetime.
 */
export function useProfile(userId: string) {
  const [state, setState] = useState<ProfileState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .maybeSingle<Profile>()
      .then(({ data, error }) => {
        if (cancelled) return
        setState(error ? { status: 'error', message: error.message } : { status: 'ready', profile: data })
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const setProfile = useCallback((profile: Profile) => setState({ status: 'ready', profile }), [])

  return { state, setProfile }
}

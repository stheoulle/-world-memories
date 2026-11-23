import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill them in.',
  )
}

/**
 * Error returned in the URL by a failed magic link (e.g. expired or already used),
 * read before the Supabase client consumes and clears the URL fragment.
 */
export const initialAuthError: string | null = (() => {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const message = params.get('error_description') ?? params.get('error')
  if (message) {
    // Drop the error from the address bar so a reload does not show it again.
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  return message
})()

export const supabase = createClient(url, key, {
  auth: {
    // Implicit flow (tokens in the URL fragment) so that a magic link opened in a
    // different browser than the one that requested it still logs in. PKCE would
    // require the same browser.
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})

/** Where magic links send the user back to: this app's root, locally or on GH Pages. */
export const appUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href

import { supabase } from '../lib/supabase'
import type { Profile } from './useProfile'

export function UserMenu({ profile }: { profile: Profile }) {
  return (
    <div className="user-menu">
      <span className="user-name">{profile.display_name}</span>
      <button className="btn btn-link" onClick={() => supabase.auth.signOut()}>
        Log out
      </button>
    </div>
  )
}

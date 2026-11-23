import type { Session } from '@supabase/supabase-js'
import type { LngLat } from 'maplibre-gl'
import { useState } from 'react'
import { LoginScreen } from './auth/LoginScreen'
import { ProfileSetup } from './auth/ProfileSetup'
import { useProfile, type Profile } from './auth/useProfile'
import { useSession } from './auth/useSession'
import { Globe } from './globe/Globe'
import { supabase } from './lib/supabase'

/** Formats a coordinate as e.g. `48.8566° N, 2.3522° E` (spec §4.2). */
function formatLngLat({ lng, lat }: LngLat): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`
}

export default function App() {
  const session = useSession()
  const [clicked, setClicked] = useState<LngLat | null>(null)

  const loggedIn = !!session

  return (
    <div className="app">
      <Globe autoRotate={!loggedIn} onMapClick={loggedIn ? setClicked : undefined} />
      {loggedIn && (
        <header className="app-header">
          <span className="app-title">🌍 World Memories</span>
        </header>
      )}

      {session === null && <LoginScreen />}
      {session && (
        // Keyed by user so all member state resets when a different user logs in.
        <MemberArea key={session.user.id} session={session} clicked={clicked} />
      )}
    </div>
  )
}

type MemberAreaProps = {
  session: Session
  clicked: LngLat | null
}

/** Everything shown to a logged-in member. */
function MemberArea({ session, clicked }: MemberAreaProps) {
  const { state, setProfile } = useProfile(session.user.id)

  if (state.status === 'loading') return null
  if (state.status === 'error') {
    return (
      <div className="overlay">
        <div className="card">
          <p className="form-error">Could not load your profile: {state.message}</p>
          <button className="btn btn-secondary" onClick={() => supabase.auth.signOut()}>
            Log out
          </button>
        </div>
      </div>
    )
  }
  if (!state.profile) return <ProfileSetup email={session.user.email} onCreated={setProfile} />

  return (
    <>
      <UserMenu profile={state.profile} />
      {/* Milestone 1 placeholder, replaced by pin creation in milestone 3. */}
      {clicked && <div className="coord-readout">{formatLngLat(clicked.wrap())}</div>}
    </>
  )
}

function UserMenu({ profile }: { profile: Profile }) {
  return (
    <div className="user-menu">
      <span className="user-name">{profile.display_name}</span>
      <button className="btn btn-link" onClick={() => supabase.auth.signOut()}>
        Log out
      </button>
    </div>
  )
}

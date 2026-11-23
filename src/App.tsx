import type { Session } from '@supabase/supabase-js'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useState } from 'react'
import { LoginScreen } from './auth/LoginScreen'
import { ProfileSetup } from './auth/ProfileSetup'
import { useProfile, type Profile } from './auth/useProfile'
import { useSession } from './auth/useSession'
import { Globe } from './globe/Globe'
import { supabase } from './lib/supabase'
import { PinWorkspace } from './pins/PinWorkspace'

export default function App() {
  const session = useSession()
  const [map, setMap] = useState<MapLibreMap | null>(null)

  const loggedIn = !!session

  return (
    <div className="app">
      <Globe autoRotate={!loggedIn} onMapReady={setMap} />
      {loggedIn && (
        <header className="app-header">
          <span className="app-title">🌍 World Memories</span>
        </header>
      )}

      {session === null && <LoginScreen />}
      {session && map && (
        // Keyed by user so all member state resets when a different user logs in.
        <MemberArea key={session.user.id} session={session} map={map} />
      )}
    </div>
  )
}

type MemberAreaProps = {
  session: Session
  map: MapLibreMap
}

/** Everything shown to a logged-in member. */
function MemberArea({ session, map }: MemberAreaProps) {
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
      <PinWorkspace map={map} />
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

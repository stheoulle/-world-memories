import { supabase } from '../lib/supabase'
import type { Profile } from './useProfile'
import { useI18n } from '../i18n/context'
import { LanguageToggle } from '../i18n/LanguageToggle'

export function UserMenu({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  return (
    <div className="user-menu">
      <span className="user-name">{profile.display_name}</span>
      <LanguageToggle />
      <button className="btn btn-link" onClick={() => supabase.auth.signOut()}>
        {t.logOut}
      </button>
    </div>
  )
}

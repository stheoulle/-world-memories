import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from './useProfile'
import { useI18n } from '../i18n/context'
import { LanguageToggle } from '../i18n/LanguageToggle'

type ProfileSetupProps = {
  email: string | undefined
  onCreated: (profile: Profile) => void
}

/** Shown on first login: the member chooses the display name shown on their pins. */
export function ProfileSetup({ email, onCreated }: ProfileSetupProps) {
  const { t } = useI18n()
  const [name, setName] = useState(() => email?.split('@')[0] ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const displayName = name.trim()
    if (!displayName) return
    setSaving(true)
    setError(null)

    const { data, error } = await supabase
      .from('profiles')
      .insert({ display_name: displayName })
      .select('id, display_name')
      .single<Profile>()

    setSaving(false)
    if (error) setError(error.message)
    else onCreated(data)
  }

  return (
    <div className="overlay">
      <form className="card" onSubmit={handleSubmit}>
        <div className="card-heading">
          <h1 className="card-title">{t.welcome}</h1>
          <LanguageToggle />
        </div>
        <p className="card-subtitle">{t.chooseName}</p>
        <label className="field">
          <span>{t.displayName}</span>
          <input
            required
            autoFocus
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
          {saving ? t.saving : t.continue}
        </button>
      </form>
    </div>
  )
}

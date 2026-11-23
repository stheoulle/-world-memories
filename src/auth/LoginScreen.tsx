import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n/context'
import type { Messages } from '../i18n/en'
import { LanguageToggle } from '../i18n/LanguageToggle'
import { appUrl, initialAuthError, supabase } from '../lib/supabase'

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  /** Rendered from the current messages, so it follows a language switch. */
  | { kind: 'error'; text: (t: Messages) => string }

export function LoginScreen() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>(() =>
    initialAuthError ? { kind: 'error', text: (m) => m.linkInvalid(initialAuthError!) } : { kind: 'idle' },
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (!address) return
    setStatus({ kind: 'sending' })

    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: false, emailRedirectTo: appUrl },
    })

    if (!error) {
      setStatus({ kind: 'sent', email: address })
    } else if (error.code === 'over_email_send_rate_limit') {
      // Project-wide hourly cap of Supabase's built-in email sender (a few emails per hour).
      setStatus({ kind: 'error', text: (m) => m.tooManyEmails })
    } else if (error.status === 429) {
      // Per-address cooldown between two login emails.
      setStatus({ kind: 'error', text: (m) => m.waitAMinute })
    } else if (error.code === 'otp_disabled' || error.code === 'signup_disabled') {
      // Uninvited address: answer as for an invited one, so the form does not reveal who is a member.
      setStatus({ kind: 'sent', email: address })
    } else {
      setStatus({ kind: 'error', text: () => error.message })
    }
  }

  return (
    <div className="overlay">
      <form className="card" onSubmit={handleSubmit}>
        <div className="card-heading">
          <h1 className="card-title">🌍 {t.appName}</h1>
          <LanguageToggle />
        </div>

        {status.kind === 'sent' ? (
          <>
            <p>{t.linkSent(status.email)}</p>
            <button type="button" className="btn btn-secondary" onClick={() => setStatus({ kind: 'idle' })}>
              {t.useAnotherEmail}
            </button>
          </>
        ) : (
          <>
            <p className="card-subtitle">{t.loginSubtitle}</p>
            <label className="field">
              <span>{t.email}</span>
              <input
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status.kind === 'sending'}
              />
            </label>
            {status.kind === 'error' && <p className="form-error">{status.text(t)}</p>}
            <button type="submit" className="btn btn-primary" disabled={status.kind === 'sending'}>
              {status.kind === 'sending' ? t.sending : t.sendLink}
            </button>
          </>
        )}
      </form>
    </div>
  )
}

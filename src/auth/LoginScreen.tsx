import { useState, type FormEvent } from 'react'
import { appUrl, initialAuthError, supabase } from '../lib/supabase'

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string }

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>(
    initialAuthError
      ? { kind: 'error', message: `This login link did not work (${initialAuthError}). Request a new one.` }
      : { kind: 'idle' },
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
    } else if (error.status === 429) {
      setStatus({ kind: 'error', message: 'Too many attempts. Please wait a minute and try again.' })
    } else if (error.code === 'otp_disabled' || error.code === 'signup_disabled') {
      // Uninvited address: answer as for an invited one, so the form does not reveal who is a member.
      setStatus({ kind: 'sent', email: address })
    } else {
      setStatus({ kind: 'error', message: error.message })
    }
  }

  return (
    <div className="overlay">
      <form className="card" onSubmit={handleSubmit}>
        <h1 className="card-title">🌍 World Memories</h1>

        {status.kind === 'sent' ? (
          <>
            <p>
              If <strong>{status.email}</strong> is invited, a login link is on its way. Open it on this device or
              any other.
            </p>
            <button type="button" className="btn btn-secondary" onClick={() => setStatus({ kind: 'idle' })}>
              Use another email
            </button>
          </>
        ) : (
          <>
            <p className="card-subtitle">Invited members only. Enter your email to receive a login link.</p>
            <label className="field">
              <span>Email</span>
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
            {status.kind === 'error' && <p className="form-error">{status.message}</p>}
            <button type="submit" className="btn btn-primary" disabled={status.kind === 'sending'}>
              {status.kind === 'sending' ? 'Sending…' : 'Send login link'}
            </button>
          </>
        )}
      </form>
    </div>
  )
}

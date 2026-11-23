import { useState } from 'react'
import { formatDateRange, formatTimestamp } from '../lib/format'
import { Panel } from '../ui/Panel'
import type { Pin } from './types'

type PinCardProps = {
  pin: Pin
  onClose: () => void
  onEdit: () => void
  onFlyTo: () => void
  onDelete: () => Promise<void>
}

/** Read-only view of a pin with its actions (spec §4.3). */
export function PinCard({ pin, onClose, onEdit, onFlyTo, onDelete }: PinCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setDeleting(false)
    }
  }

  const author = pin.author?.display_name ?? 'a former member'
  const editor = pin.updated_by ? (pin.editor?.display_name ?? 'a former member') : null

  return (
    <Panel label={pin.title}>
      <div className="pin-card">
        <div className="pin-card-header">
          <span className="pin-card-emoji" aria-hidden>
            {pin.emoji}
          </span>
          <div className="pin-card-heading">
            <h2 className="panel-title">{pin.title}</h2>
            {pin.place_name && <p className="pin-card-place">{pin.place_name}</p>}
          </div>
          <button className="btn-icon" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="pin-card-dates">{formatDateRange(pin.date_start, pin.date_end)}</p>

        {pin.comment && <p className="pin-card-comment">{pin.comment}</p>}

        <p className="pin-card-meta">
          Added by {author} on {formatTimestamp(pin.created_at)}
          {editor && (
            <>
              {' · '}Edited by {editor} on {formatTimestamp(pin.updated_at)}
            </>
          )}
        </p>

        {error && <p className="form-error">{error}</p>}

        {confirmingDelete ? (
          <div className="panel-actions panel-actions-confirm">
            <span>Delete this pin for everyone?</span>
            <button className="btn btn-secondary" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
              Keep
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : (
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={onFlyTo}>
              Fly to
            </button>
            <button className="btn btn-secondary btn-danger-text" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
            <button className="btn btn-primary" onClick={onEdit}>
              Edit
            </button>
          </div>
        )}
      </div>
    </Panel>
  )
}

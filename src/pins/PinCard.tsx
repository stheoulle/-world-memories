import { useState } from 'react'
import { formatDateRange, formatTimestamp } from '../lib/format'
import { Panel } from '../ui/Panel'
import type { Pin } from './types'
import { useI18n } from '../i18n/context'

type PinCardProps = {
  pin: Pin
  onClose: () => void
  onEdit: () => void
  onFlyTo: () => void
  onDelete: () => Promise<void>
}

/** Read-only view of a pin with its actions (spec §4.3). */
export function PinCard({ pin, onClose, onEdit, onFlyTo, onDelete }: PinCardProps) {
  const { t, lang } = useI18n()
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

  const author = pin.author?.display_name ?? t.formerMember
  const editor = pin.updated_by ? (pin.editor?.display_name ?? t.formerMember) : null

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
          <button className="btn-icon" aria-label={t.close} onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="pin-card-dates">{formatDateRange(pin.date_start, pin.date_end, lang)}</p>

        {pin.comment && <p className="pin-card-comment">{pin.comment}</p>}

        <p className="pin-card-meta">
          {t.addedBy(author, formatTimestamp(pin.created_at, lang))}
          {editor && ` · ${t.editedBy(editor, formatTimestamp(pin.updated_at, lang))}`}
        </p>

        {error && <p className="form-error">{error}</p>}

        {confirmingDelete ? (
          <div className="panel-actions panel-actions-confirm">
            <span>{t.deleteConfirm}</span>
            <button className="btn btn-secondary" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
              {t.keep}
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? t.deleting : t.delete}
            </button>
          </div>
        ) : (
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={onFlyTo}>
              {t.flyTo}
            </button>
            <button className="btn btn-secondary btn-danger-text" onClick={() => setConfirmingDelete(true)}>
              {t.delete}
            </button>
            <button className="btn btn-primary" onClick={onEdit}>
              {t.edit}
            </button>
          </div>
        )}
      </div>
    </Panel>
  )
}

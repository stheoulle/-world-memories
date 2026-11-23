import { lazy, Suspense, useState, type FormEvent } from 'react'
import { formatLatLng } from '../lib/format'
import { Panel } from '../ui/Panel'
import { COMMENT_MAX, PLACE_MAX, TITLE_MAX, type PinInput } from './types'

const EmojiPickerPopover = lazy(() => import('./EmojiPickerPopover'))

type PinFormProps = {
  draft: PinInput
  isNew: boolean
  /** True while the next map click sets the location. */
  picking: boolean
  /** A place name lookup for the current location is in progress. */
  lookingUp: boolean
  onChange: (patch: Partial<PinInput>) => void
  onTogglePicking: () => void
  /** Replace the place name with the one found at the current location. */
  onLookUpPlace: () => void
  onSubmit: () => Promise<void>
  onCancel: () => void
}

/** Returns why the draft cannot be saved, or null when it is valid. */
function validatePin(draft: PinInput): string | null {
  if (!draft.title.trim()) return 'A title is required.'
  if (!draft.date_start) return 'A start date is required.'
  if (draft.date_end && draft.date_end < draft.date_start) return 'The end date must be on or after the start date.'
  return null
}

export function PinForm({
  draft,
  isNew,
  picking,
  lookingUp,
  onChange,
  onTogglePicking,
  onLookUpPlace,
  onSubmit,
  onCancel,
}: PinFormProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invalid = validatePin(draft)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (invalid) {
      setError(invalid)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  return (
    <Panel label={isNew ? 'New pin' : 'Edit pin'}>
      <form className="pin-form" onSubmit={handleSubmit}>
        <h2 className="panel-title">{isNew ? 'New pin' : 'Edit pin'}</h2>

        <div className="field">
          <span>Location</span>
          <div className="location-row">
            <span className="location-coords">
              {picking ? 'Click on the globe to choose a new location…' : formatLatLng(draft.lat, draft.lng)}
            </span>
            <button type="button" className="btn btn-secondary btn-small" onClick={onTogglePicking}>
              {picking ? 'Cancel' : 'Move'}
            </button>
          </div>
          {!picking && <span className="field-hint">You can also drag the pin on the globe.</span>}
        </div>

        <div className="field">
          <label htmlFor="pin-place">Place</label>
          <div className="input-with-button">
            <input
              id="pin-place"
              value={draft.place_name ?? ''}
              maxLength={PLACE_MAX}
              placeholder={lookingUp ? 'Looking up the place…' : 'e.g. Kyoto, Japan'}
              onChange={(e) => onChange({ place_name: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={onLookUpPlace}
              disabled={lookingUp}
              title="Fill in the place from the pin's location"
            >
              {lookingUp ? '…' : 'Look up'}
            </button>
          </div>
        </div>

        <div className="field-row">
          <div className="field emoji-field">
            <span>Icon</span>
            <button
              type="button"
              className="emoji-button"
              aria-label={`Icon: ${draft.emoji}. Change`}
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((open) => !open)}
            >
              {draft.emoji}
            </button>
            {pickerOpen && (
              <Suspense fallback={<div className="emoji-popover emoji-picker-message">Loading…</div>}>
                <EmojiPickerPopover
                  onSelect={(emoji) => {
                    onChange({ emoji })
                    setPickerOpen(false)
                  }}
                  onClose={() => setPickerOpen(false)}
                />
              </Suspense>
            )}
          </div>

          <label className="field field-grow">
            <span>Title</span>
            <input
              required
              autoFocus
              maxLength={TITLE_MAX}
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field field-grow">
            <span>Start date</span>
            <input
              type="date"
              required
              value={draft.date_start}
              onChange={(e) => onChange({ date_start: e.target.value })}
            />
          </label>
          <label className="field field-grow">
            <span>End date (optional)</span>
            <input
              type="date"
              min={draft.date_start || undefined}
              value={draft.date_end ?? ''}
              onChange={(e) => onChange({ date_end: e.target.value || null })}
            />
          </label>
        </div>

        <label className="field">
          <span>Comment</span>
          <textarea
            rows={5}
            maxLength={COMMENT_MAX}
            value={draft.comment ?? ''}
            onChange={(e) => onChange({ comment: e.target.value })}
          />
          <span className="field-hint field-counter">
            {(draft.comment ?? '').length} / {COMMENT_MAX}
          </span>
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="panel-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !!invalid}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Panel>
  )
}

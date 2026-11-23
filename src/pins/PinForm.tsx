import { lazy, Suspense, useState, type FormEvent } from 'react'
import { formatLatLng } from '../lib/format'
import { Panel } from '../ui/Panel'
import { COMMENT_MAX, PLACE_MAX, TITLE_MAX, type PinInput } from './types'
import { useI18n } from '../i18n/context'
import type { Messages } from '../i18n/en'

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
function validatePin(draft: PinInput, t: Messages): string | null {
  if (!draft.title.trim()) return t.titleRequired
  if (!draft.date_start) return t.startRequired
  if (draft.date_end && draft.date_end < draft.date_start) return t.endBeforeStart
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
  const { t } = useI18n()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invalid = validatePin(draft, t)

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
    <Panel label={isNew ? t.newPin : t.editPin}>
      <form className="pin-form" onSubmit={handleSubmit}>
        <h2 className="panel-title">{isNew ? t.newPin : t.editPin}</h2>

        <div className="field">
          <span>{t.location}</span>
          <div className="location-row">
            <span className="location-coords">
              {picking ? t.pickLocation : formatLatLng(draft.lat, draft.lng)}
            </span>
            <button type="button" className="btn btn-secondary btn-small" onClick={onTogglePicking}>
              {picking ? t.cancel : t.move}
            </button>
          </div>
          {!picking && <span className="field-hint">{t.dragHint}</span>}
        </div>

        <div className="field">
          <label htmlFor="pin-place">{t.place}</label>
          <div className="input-with-button">
            <input
              id="pin-place"
              value={draft.place_name ?? ''}
              maxLength={PLACE_MAX}
              placeholder={lookingUp ? t.lookingUpPlace : t.placePlaceholder}
              onChange={(e) => onChange({ place_name: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={onLookUpPlace}
              disabled={lookingUp}
              title={t.lookUpTitle}
            >
              {lookingUp ? '…' : t.lookUp}
            </button>
          </div>
        </div>

        <div className="field-row">
          <div className="field emoji-field">
            <span>{t.icon}</span>
            <button
              type="button"
              className="emoji-button"
              aria-label={t.changeIcon(draft.emoji)}
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((open) => !open)}
            >
              {draft.emoji}
            </button>
            {pickerOpen && (
              <Suspense fallback={<div className="emoji-popover emoji-picker-message">{t.loading}</div>}>
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
            <span>{t.title}</span>
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
            <span>{t.startDate}</span>
            <input
              type="date"
              required
              value={draft.date_start}
              onChange={(e) => onChange({ date_start: e.target.value })}
            />
          </label>
          <label className="field field-grow">
            <span>{t.endDate}</span>
            <input
              type="date"
              min={draft.date_start || undefined}
              value={draft.date_end ?? ''}
              onChange={(e) => onChange({ date_end: e.target.value || null })}
            />
          </label>
        </div>

        <label className="field">
          <span>{t.comment}</span>
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
            {t.cancel}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !!invalid}>
            {saving ? t.saving : t.save}
          </button>
        </div>
      </form>
    </Panel>
  )
}

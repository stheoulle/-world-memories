import { EmojiPicker } from 'frimousse'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '../ui/useIsMobile'
import { useI18n } from '../i18n/context'

type EmojiPickerPopoverProps = {
  onSelect: (emoji: string) => void
  onClose: () => void
}

/**
 * Emoji picker: a popover under the icon button on desktop, its own bottom sheet on phones.
 * Loaded lazily (it is only needed when choosing an emoji); frimousse fetches its emoji data
 * from a CDN on first open and caches it.
 */
export default function EmojiPickerPopover({ onSelect, onClose }: EmojiPickerPopoverProps) {
  const { t, lang } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const mobile = useIsMobile()

  // Close on a click outside the popover.
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  const picker = (
    <div
      ref={ref}
      className={mobile ? 'emoji-popover is-sheet' : 'emoji-popover'}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          // Close only the popover, not the whole form.
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <EmojiPicker.Root
        className="emoji-picker"
        columns={mobile ? 9 : 8}
        locale={lang}
        onEmojiSelect={({ emoji }) => onSelect(emoji)}
      >
        <EmojiPicker.Search className="emoji-picker-search" placeholder={t.searchEmoji} autoFocus={!mobile} />
        <EmojiPicker.Viewport className="emoji-picker-viewport">
          <EmojiPicker.Loading className="emoji-picker-message">{t.loading}</EmojiPicker.Loading>
          <EmojiPicker.Empty className="emoji-picker-message">{t.noEmoji}</EmojiPicker.Empty>
          <EmojiPicker.List
            className="emoji-picker-list"
            components={{
              CategoryHeader: ({ category, ...props }) => (
                <div className="emoji-picker-category" {...props}>
                  {category.label}
                </div>
              ),
              Emoji: ({ emoji, ...props }) => (
                <button className="emoji-picker-emoji" {...props}>
                  {emoji.emoji}
                </button>
              ),
            }}
          />
        </EmojiPicker.Viewport>
      </EmojiPicker.Root>
    </div>
  )

  // On phones the form is a scrolling bottom sheet that would clip the picker, and its
  // backdrop-filter traps `position: fixed`, so the picker sheet is rendered at the body level.
  if (!mobile) return picker
  return createPortal(
    <>
      <div className="emoji-sheet-backdrop" />
      {picker}
    </>,
    document.body,
  )
}

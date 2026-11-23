import { EmojiPicker } from 'frimousse'
import { useEffect, useRef } from 'react'

type EmojiPickerPopoverProps = {
  onSelect: (emoji: string) => void
  onClose: () => void
}

/**
 * Emoji picker in a popover. Loaded lazily (it is only needed when choosing an emoji);
 * frimousse fetches its emoji data from a CDN on first open and caches it.
 */
export default function EmojiPickerPopover({ onSelect, onClose }: EmojiPickerPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on a click outside the popover.
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="emoji-popover"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          // Close only the popover, not the whole form.
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <EmojiPicker.Root className="emoji-picker" columns={8} onEmojiSelect={({ emoji }) => onSelect(emoji)}>
        <EmojiPicker.Search className="emoji-picker-search" placeholder="Search emoji…" autoFocus />
        <EmojiPicker.Viewport className="emoji-picker-viewport">
          <EmojiPicker.Loading className="emoji-picker-message">Loading…</EmojiPicker.Loading>
          <EmojiPicker.Empty className="emoji-picker-message">No emoji found.</EmojiPicker.Empty>
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
}

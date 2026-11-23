import type { ReactNode } from 'react'

type PanelProps = {
  label: string
  children: ReactNode
}

/** Side panel on desktop, bottom sheet on mobile (spec §4.2). */
export function Panel({ label, children }: PanelProps) {
  return (
    <aside className="panel" role="dialog" aria-label={label}>
      {children}
    </aside>
  )
}

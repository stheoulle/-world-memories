/**
 * The World Memories mark: a line-drawn globe with a purple pin dot.
 * Colors come from the theme variables, see index.css.
 */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <g stroke="var(--green)" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" strokeWidth="1.7" />
        <ellipse cx="12" cy="12" rx="4" ry="9" strokeWidth="1.2" opacity="0.75" />
        <path d="M3.6 9h16.8M3.6 15h16.8" strokeWidth="1.2" opacity="0.75" />
      </g>
      <circle cx="17" cy="7" r="2.6" fill="var(--purple)" stroke="var(--bg)" strokeWidth="1.4" />
    </svg>
  )
}

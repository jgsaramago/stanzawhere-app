import type { DressCode } from '../types'
import { DRESS_CODES } from '../types'

/** Tiny dress-code marks for calendar chips + legend. */
export function DressCodeIcon({
  id,
  size = 14,
}: {
  id: DressCode
  size?: number
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true as const,
  }

  switch (id) {
    case 'formal':
      // Bow tie / gala
      return (
        <svg {...common}>
          <path
            d="M12 10.5c1.2-1.8 3.8-2.2 5.2-.6.6.7.6 1.7 0 2.4L12 18l-5.2-5.7c-.6-.7-.6-1.7 0-2.4 1.4-1.6 4-.8 5.2.6Z"
            fill="currentColor"
          />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <path
            d="M8 7.5c1.5.4 2.8 1.2 4 2.4 1.2-1.2 2.5-2 4-2.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'business':
      // Suit + tie
      return (
        <svg {...common}>
          <path
            d="M8 21V10l4 3 4-3v11"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M8 10 5.5 7.5 9 4h6l3.5 3.5L16 10"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M12 13v8" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 7.5 10.5 13h3L12 7.5Z" fill="currentColor" />
        </svg>
      )
    case 'smart-business':
      // Suit, open collar (no tie)
      return (
        <svg {...common}>
          <path
            d="M8 21V10l4 2.5L16 10v11"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M8 10 5.5 7.5 9 4h6l3.5 3.5L16 10"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 10.5 12 13l1.5-2.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'business-casual':
      // Shirt
      return (
        <svg {...common}>
          <path
            d="M8 21V9.5L5.5 7 9 4h6l3.5 3L16 9.5V21"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M12 4v5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="11" r="1" fill="currentColor" />
        </svg>
      )
    case 'casual':
      // T-shirt
      return (
        <svg {...common}>
          <path
            d="M9 4h6l2.5 3.5L21 6l-1 5h-3v10H7V11H4L3 6l3.5 1.5L9 4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'sporty':
      // Sneaker / active
      return (
        <svg {...common}>
          <path
            d="M4 15.5c2-.5 3.5-2.5 6-2.5h5.5c2.5 0 4 1.2 5.5 2.8H4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 16.5h14c0 1.8-1.5 3-3.4 3H8.2C6.2 19.5 5 18.2 5 16.5Z"
            fill="currentColor"
          />
          <path
            d="M10 13c.8-2 2-3.2 4-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
  }
}

export function DressCodeMark({
  id,
  className = '',
}: {
  id: DressCode
  className?: string
}) {
  const meta = DRESS_CODES.find((d) => d.id === id)
  if (!meta) return null
  return (
    <span
      className={`dress-mark dress-${id} ${className}`.trim()}
      title={`${meta.label}: ${meta.hint}`}
      aria-label={`${meta.label} dress code`}
    >
      <DressCodeIcon id={id} size={12} />
    </span>
  )
}

export function DressCodeLegend() {
  return (
    <div className="dress-code-strip" aria-label="Dress code legend">
      <strong>Dress code</strong>
      {DRESS_CODES.map((d) => (
        <span key={d.id} className={`dress-legend-item dress-${d.id}`} title={d.hint}>
          <DressCodeIcon id={d.id} size={13} />
          <span className="dress-legend-label">{d.label}</span>
        </span>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'

/** Legacy keys that used to suppress the splash — always cleared. */
const LEGACY_SPLASH_KEYS = [
  'stanza-where-splash-v2',
  'stanza-where-splash-seen',
]

function clearSplashSuppressFlags() {
  try {
    for (const key of LEGACY_SPLASH_KEYS) sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Always show the animated intro on a full page load / app open. */
export function shouldShowSplash(): boolean {
  clearSplashSuppressFlags()
  return true
}

export function IntroSplash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    clearSplashSuppressFlags()
    const t = window.setTimeout(() => dismiss(), 2800)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    if (leaving) return
    setLeaving(true)
    window.setTimeout(onDone, 450)
  }

  return (
    <div
      className={`intro-splash ${leaving ? 'leaving' : ''}`}
      onClick={dismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') dismiss()
      }}
      aria-label="Enter StanzaWhere"
    >
      <div className="intro-glow" aria-hidden />
      <div className="intro-card">
        <img
          className="intro-logo"
          src="/stanza-logo.png"
          alt="StanzaWhere"
        />
        <p className="intro-sub">Team travel, PTO & locations</p>
        <span className="intro-skip">Click anywhere to continue</span>
      </div>
    </div>
  )
}

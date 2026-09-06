import { useEffect, useRef, useState } from 'react'
import { SHAPE_ELLIPSE, SHAPE_ERASE, SHAPE_FREE, SHAPE_LINE, SHAPE_RECT, SHAPE_TRIANGLE, TOOLS } from '../lib/shapes.js'
import ToolButton from './ToolButton.jsx'

const ICONS = {
  [SHAPE_FREE]: (
    <svg className="shape-icon" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2 13 C5 4, 8 15, 16 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  [SHAPE_LINE]: (
    <svg className="shape-icon" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3 14 L15 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  [SHAPE_RECT]: (
    <svg className="shape-icon" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="3.5" y="4.5" width="11" height="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  [SHAPE_ELLIPSE]: (
    <svg className="shape-icon" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  [SHAPE_TRIANGLE]: (
    <svg className="shape-icon" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 3.5 L15.2 14.5 H2.8 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  [SHAPE_ERASE]: (
    <svg className="shape-icon" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 11 L9 4 L14 9 L9 14 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 11 H9 L9 14 H4 Z" fill="currentColor" opacity="0.28" />
    </svg>
  ),
}

export default function ToolSheet({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = TOOLS.find((t) => t.id === value) || TOOLS[0]

  // The sheet floats over the paper, so it closes the way a real drawer does:
  // Escape, or a touch anywhere else. Without this, the first thing someone
  // does after picking a tool — draw — is swallowed by the open panel.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <aside ref={ref} className={`sheet ${open ? 'is-open' : ''}`} aria-label="Գործիքատուփ">
      <ToolButton
        label={open ? 'Փակել գործիքները' : 'Գործիքներ'}
        className="sheet__tab"
        // Armed whenever a tool other than freehand is on, so the tab itself
        // says which mode the next stroke is in.
        active={open || value !== SHAPE_FREE}
        aria-expanded={open}
        onPress={() => setOpen((v) => !v)}
      >
        {ICONS[current.id]}
        <span className="sheet__chevron" aria-hidden="true">{open ? '›' : '‹'}</span>
      </ToolButton>
      <div className="sheet__list" hidden={!open} role="group" aria-label="Պատկեր">
        {TOOLS.map((t) => (
          <ToolButton
            key={t.id}
            label={t.label}
            active={value === t.id}
            className="sheet__tool"
            onPress={() => {
              onChange(value === t.id && t.id !== SHAPE_FREE && t.id !== SHAPE_ERASE ? SHAPE_FREE : t.id)
              setOpen(false) // Pick and draw. Two taps to get back to the paper is one too many.
            }}
          >
            {ICONS[t.id]}
            <span className="sheet__name">{t.label}</span>
          </ToolButton>
        ))}
      </div>
    </aside>
  )
}

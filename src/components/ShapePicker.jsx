import { SHAPE_ELLIPSE, SHAPE_FREE, SHAPE_LINE, SHAPE_RECT, SHAPE_TRIANGLE, SHAPES } from '../lib/shapes.js'
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
}

export default function ShapePicker({ value, onChange }) {
  return (
    <div className="picker picker--shape" role="group" aria-label="Պատկեր">
      {SHAPES.map((s) => (
        <ToolButton
          key={s.id}
          label={s.label}
          active={value === s.id}
          className="shape"
          onPress={() => onChange(value === s.id && s.id !== SHAPE_FREE ? SHAPE_FREE : s.id)}
        >
          {ICONS[s.id]}
        </ToolButton>
      ))}
    </div>
  )
}

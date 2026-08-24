import { COLORS } from '../lib/constants.js'
import ToolButton from './ToolButton.jsx'

/** The ring on each swatch shows how much of the drawing uses that colour. */
export default function ColorPicker({ value, onChange, byColor = {} }) {
  const total = Object.values(byColor).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="picker picker--color" role="group" aria-label="Գույն">
      {COLORS.map((c) => {
        const share = (byColor[c.hex] || 0) / total
        return (
          <ToolButton
            key={c.id}
            label={c.label}
            active={value === c.hex}
            className="swatch"
            onPress={() => onChange(c.hex)}
            style={{ '--swatch': c.hex, '--share': share }}
          >
            <span className="swatch__dot" />
            <span className="swatch__ring" aria-hidden="true" />
          </ToolButton>
        )
      })}
    </div>
  )
}

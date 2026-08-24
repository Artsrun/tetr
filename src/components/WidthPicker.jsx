import { WIDTHS } from '../lib/constants.js'
import ToolButton from './ToolButton.jsx'

/** Each dot is rendered at the actual stroke size — no abstraction to decode. */
export default function WidthPicker({ value, onChange, color }) {
  return (
    <div className="picker picker--width" role="group" aria-label="Հաստություն">
      {WIDTHS.map((w) => (
        <ToolButton
          key={w}
          label={`${w}px`}
          active={value === w}
          className="width"
          onPress={() => onChange(w)}
        >
          <span
            className="width__dot"
            style={{ width: `${w * 2.4}px`, height: `${w * 2.4}px`, background: color }}
          />
        </ToolButton>
      ))}
    </div>
  )
}

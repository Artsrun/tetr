import { useEffect, useState } from 'react'
import { CLEAR_ARM_MS } from '../lib/constants.js'
import { play } from '../lib/sound.js'
import ToolButton from './ToolButton.jsx'

/**
 * Two-step and still recoverable (CLAUDE.md). It sits a thumb-width from undo:
 * first press arms, second commits, auto-disarms at 3s — and useDrawing routes
 * cleared strokes into redo anyway.
 */
export default function ClearButton({ onClear, disabled }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), CLEAR_ARM_MS)
    return () => clearTimeout(t)
  }, [armed])

  useEffect(() => {
    if (disabled) setArmed(false)
  }, [disabled])

  return (
    <ToolButton
      label={armed ? 'Հաստատել ջնջումը' : 'Ջնջել'}
      className={armed ? 'clear is-armed' : 'clear'}
      disabled={disabled}
      cue={null}
      onPress={() => {
        if (armed) {
          setArmed(false)
          onClear()
        } else {
          play('arm')
          setArmed(true)
        }
      }}
    >
      ✕
    </ToolButton>
  )
}

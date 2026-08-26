import { useCallback } from 'react'
import { play, unlock } from '../lib/sound.js'

/**
 * Every control is built on this.
 *
 * Buttons fire on pointerdown (CLAUDE.md): mobile browsers hold a click
 * 50-300ms waiting on double-tap, and on a tool this direct that delay reads
 * as breakage.
 */
export default function ToolButton({
  onPress,
  label,
  cue = 'tap',
  disabled = false,
  active = false,
  className = '',
  children,
  onLongPress,
  longPressMs = 500,
  ...rest
}) {
  const handleDown = useCallback(
    (e) => {
      unlock() // iOS: prime the AudioContext inside the gesture.
      if (disabled) return
      e.preventDefault()

      let fired = false
      let timer = null

      if (onLongPress) {
        timer = setTimeout(() => {
          fired = true
          if (cue) play(cue)
          onLongPress(e)
        }, longPressMs)
      }

      const finish = () => {
        if (timer) clearTimeout(timer)
        document.removeEventListener('pointerup', finish)
        document.removeEventListener('pointercancel', finish)
        if (fired) return
        if (cue) play(cue)
        onPress?.(e)
      }

      if (onLongPress) {
        document.addEventListener('pointerup', finish)
        document.addEventListener('pointercancel', finish)
      } else {
        if (cue) play(cue)
        onPress?.(e)
      }
    },
    [onPress, onLongPress, longPressMs, cue, disabled],
  )

  return (
    <button
      type="button"
      className={`tool ${active ? 'is-active' : ''} ${className}`.trim()}
      aria-label={label}
      aria-pressed={active || undefined}
      disabled={disabled}
      onPointerDown={handleDown}
      // No onClick: pointerdown already fired. Keyboard users get this instead.
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!disabled) {
            if (cue) play(cue)
            onPress?.(e)
          }
        }
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

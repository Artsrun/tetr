/**
 * Sound and animation fire from one celebrate() call in App (CLAUDE.md):
 * 410ms of chime timed against the same duration of sweep, with the stamp
 * landing on the final pip. Split them and it reads as two unrelated events.
 */
export default function Celebration({ active }) {
  if (!active) return null
  return (
    <div className="celebrate" aria-hidden="true">
      <span className="celebrate__sweep" />
      <span className="celebrate__stamp">🦊</span>
    </div>
  )
}

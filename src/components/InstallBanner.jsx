import { useState } from 'react'
import ToolButton from './ToolButton.jsx'

/**
 * Waits until something is drawn (CLAUDE.md): asking a stranger to install an
 * app they haven't tried is how banners get ignored. iOS gets instructions
 * rather than a button, because iOS has no install API at all.
 */
export default function InstallBanner({ pwa, hasDrawn }) {
  const [dismissed, setDismissed] = useState(false)

  const show = hasDrawn && !dismissed && !pwa.installed &&
    (pwa.canInstall || pwa.needsInstructions)
  if (!show) return null

  return (
    <div className="install" role="note">
      {pwa.canInstall ? (
        <>
          <span>Պահի՛ր տետրը հեռախոսում</span>
          <ToolButton label="Տեղադրել" className="install__go" onPress={() => pwa.install()}>
            Տեղադրել
          </ToolButton>
        </>
      ) : (
        <span>Կիսվել ⇧ → «Ավելացնել հիմնական էկրանին»</span>
      )}
      <ToolButton label="Փակել" className="install__close" onPress={() => setDismissed(true)}>
        ✕
      </ToolButton>
    </div>
  )
}

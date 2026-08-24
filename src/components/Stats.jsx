import { useState } from 'react'
import { COLORS } from '../lib/constants.js'
import { isMuted, toggleMute } from '../lib/sound.js'
import ToolButton from './ToolButton.jsx'

export default function Stats({ stats, offline }) {
  const [open, setOpen] = useState(false)
  const [muted, setMuted] = useState(isMuted)

  const total = Object.values(stats.byColor).reduce((a, b) => a + b, 0) || 1

  return (
    <div className={`stats ${open ? 'is-open' : ''}`}>
      <div className="stats__bar">
        <ToolButton
          label={open ? 'Ծալել' : 'Բացել վիճակագրությունը'}
          className="stats__toggle"
          onPress={() => setOpen((v) => !v)}
        >
          📈 <span className="stats__summary">{stats.strokes} · {stats.cells} □</span>
        </ToolButton>

        {offline && <span className="stats__offline" title="Offline">◍</span>}

        <ToolButton
          label={muted ? 'Միացնել ձայնը' : 'Անջատել ձայնը'}
          className="stats__mute"
          cue={null}
          onPress={() => setMuted(toggleMute())}
        >
          {muted ? '🔇' : '🔈'}
        </ToolButton>
      </div>

      {open && (
        <dl className="stats__detail">
          <div><dt>Գծեր</dt><dd>{stats.strokes}</dd></div>
          <div><dt>Վանդակ</dt><dd>{stats.cells}</dd></div>
          <div><dt>Մետր</dt><dd>{stats.metres}</dd></div>
          <div><dt>Մատիտ</dt><dd>{Math.round(stats.pencilShare * 100)}%</dd></div>
          <div className="stats__colors">
            <dt>Գույներ</dt>
            <dd>
              {COLORS.map((c) => (
                <span
                  key={c.id}
                  className="stats__chip"
                  style={{
                    background: c.hex,
                    flexGrow: Math.max(0.02, (stats.byColor[c.hex] || 0) / total),
                  }}
                  title={c.label}
                />
              ))}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}

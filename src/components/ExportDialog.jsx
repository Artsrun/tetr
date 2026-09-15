import { useEffect, useMemo, useState } from 'react'
import { BACKGROUNDS } from '../lib/constants.js'
import { downloadUrl, filename, toPNG, toSVG } from '../lib/export.js'
import ToolButton from './ToolButton.jsx'

export default function ExportDialog({ strokes, size, onClose }) {
  const [bg, setBg] = useState(BACKGROUNDS[0])
  const [crop, setCrop] = useState(true)
  const [pngHref, setPngHref] = useState(null)
  const stamp = useMemo(() => new Date(), [])
  const svgName = useMemo(() => filename(stamp, 'svg'), [stamp])
  const pngName = useMemo(() => filename(stamp, 'png'), [stamp])
  const svg = useMemo(
    () => toSVG(strokes, {
      width: size.width,
      height: size.height,
      grid: bg.grid,
      background: Boolean(bg.fill),
      fill: bg.fill,
      margin: bg.margin,
      crop,
    }),
    [strokes, size, bg, crop],
  )

  const href = useMemo(() => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    return URL.createObjectURL(blob)
  }, [svg])

  useEffect(() => () => URL.revokeObjectURL(href), [href])

  useEffect(() => {
    let dead = false
    let url
    setPngHref(null)
    toPNG(svg).then((blob) => {
      if (dead) return
      url = URL.createObjectURL(blob)
      setPngHref(url)
    }).catch(() => {
      if (!dead) setPngHref(null)
    })
    return () => {
      dead = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [svg])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="export"
      role="dialog"
      aria-label="Ներբեռնել SVG"
      aria-modal="true"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="export__card">
        <p className="export__kicker">Նախադիտում</p>
        <h2 className="export__title">{svgName}</h2>
        <div className={`export__preview ${bg.fill ? 'is-paper' : 'is-clear'}`}
          style={bg.fill ? { background: bg.fill } : undefined}
        >
          <div className="export__art" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <label className="export__opt">
          <input
            type="checkbox"
            checked={crop}
            onChange={(e) => setCrop(e.target.checked)}
          />
          Կտրել շրջանակ
        </label>
        <p className="export__section">Ֆոն</p>
        <div className="export__bgs" role="listbox" aria-label="Ֆոն">
          {BACKGROUNDS.map((opt) => (
            <ToolButton
              key={opt.id}
              label={opt.label}
              className={`export__bg ${bg.id === opt.id ? 'is-active' : ''}`}
              active={bg.id === opt.id}
              onPress={() => setBg(opt)}
            >
              <span className={`export__chip export__chip--${opt.id}`} />
              <span className="export__bg-name">{opt.label}</span>
            </ToolButton>
          ))}
        </div>
        <p className="export__note">
          {crop ? 'Միայն գծագրի շրջանակը' : 'Ամբողջ էջը'}
          {bg.fill ? ` · ${bg.label}` : ' · թափանցիկ'}
        </p>
        <div className="export__row">
          <ToolButton label="Փակել" className="export__cancel" onPress={onClose}>Փակել</ToolButton>
          <ToolButton
            label="Ներբեռնել"
            className="export__go"
            onPress={() => {
              downloadUrl(href, svgName)
              onClose()
            }}
          >
            SVG
          </ToolButton>
          <ToolButton
            label="Ներբեռնել PNG"
            className="export__go"
            disabled={!pngHref}
            onPress={() => {
              if (!pngHref) return
              downloadUrl(pngHref, pngName)
              onClose()
            }}
          >
            PNG
          </ToolButton>
        </div>
      </div>
    </div>
  )
}

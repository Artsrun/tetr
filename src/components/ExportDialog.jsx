import { useEffect, useMemo, useState } from 'react'
import { downloadUrl, filename, toSVG } from '../lib/export.js'
import ToolButton from './ToolButton.jsx'

export default function ExportDialog({ strokes, size, onClose }) {
  const [paper, setPaper] = useState(false)
  const [crop, setCrop] = useState(true)
  const name = useMemo(() => filename(), [])
  const svg = useMemo(
    () => toSVG(strokes, {
      width: size.width,
      height: size.height,
      grid: paper,
      background: paper,
      crop,
    }),
    [strokes, size, paper, crop],
  )

  // Blob is ready before the tap so the download is the cropped frame, not
  // a second serialization of the full page.
  const href = useMemo(() => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    return URL.createObjectURL(blob)
  }, [svg])

  useEffect(() => () => URL.revokeObjectURL(href), [href])

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
        <h2 className="export__title">{name}</h2>
        <div className={`export__preview ${paper ? 'is-paper' : 'is-clear'}`}>
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
        <label className="export__opt">
          <input
            type="checkbox"
            checked={paper}
            onChange={(e) => setPaper(e.target.checked)}
          />
          Թուղթ և վանդակ
        </label>
        <p className="export__note">
          {crop
            ? (paper ? 'Միայն գծագրի շրջանակը՝ թղթով' : 'Միայն գծագրի շրջանակը — առանց ամբողջ էջի')
            : (paper ? 'Նոթատետրի տեսքով' : 'Առանց մեր ֆոնի — թափանցիկ SVG')}
        </p>
        <div className="export__row">
          <ToolButton label="Փակել" className="export__cancel" onPress={onClose}>Փակել</ToolButton>
          <ToolButton
            label="Ներբեռնել"
            className="export__go"
            onPress={() => {
              downloadUrl(href, name)
              onClose()
            }}
          >
            Ներբեռնել
          </ToolButton>
        </div>
      </div>
    </div>
  )
}

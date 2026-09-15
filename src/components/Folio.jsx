import { isSpread } from '../lib/spread.js'
import { MAX_ZOOM, MIN_ZOOM } from '../lib/zoom.js'
import ToolButton from './ToolButton.jsx'

export default function Folio({
  pageIndex,
  pageCount,
  canAddPage,
  onPrev,
  onNext,
  onAdd,
  zoom,
  onZoomOut,
  onZoomIn,
  onZoomReset,
}) {
  const percent = Math.round(zoom * 100)
  const spread = isSpread(zoom)

  return (
    <div className="folio">
      <div className="folio__pages" role="navigation" aria-label="Էջեր">
        <ToolButton label="Նախորդ էջ" disabled={pageIndex <= 0} onPress={onPrev}>‹</ToolButton>
        <span className="folio__mark" aria-live="polite">
          {pageIndex + 1} / {pageCount}{spread ? ' ❐' : ''}
        </span>
        <ToolButton label="Հաջորդ էջ" disabled={pageIndex >= pageCount - 1} onPress={onNext}>›</ToolButton>
        <ToolButton label="Նոր էջ" disabled={!canAddPage} onPress={onAdd}>+</ToolButton>
      </div>
      <div className="folio__zoom" role="group" aria-label="Խոշորացում">
        <ToolButton
          label={spread ? 'Փոքրացնել' : 'Փոքրացնել՝ երկու էջ'}
          disabled={percent <= MIN_ZOOM * 100}
          onPress={onZoomOut}
        >−</ToolButton>
        <ToolButton label="Վերականգնել չափը" className="folio__level" onPress={onZoomReset}>
          {percent}%
        </ToolButton>
        <ToolButton label="Խոշորացնել" disabled={percent >= MAX_ZOOM * 100} onPress={onZoomIn}>+</ToolButton>
      </div>
    </div>
  )
}

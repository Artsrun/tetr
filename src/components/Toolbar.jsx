import ClearButton from './ClearButton.jsx'
import ColorPicker from './ColorPicker.jsx'
import Folio from './Folio.jsx'
import ShapePicker from './ShapePicker.jsx'
import ToolButton from './ToolButton.jsx'
import WidthPicker from './WidthPicker.jsx'

export default function Toolbar({
  style, setStyle, drawing, onExport, onPrint, byColor,
  view, onPrevPage, onNextPage, onAddPage, onZoomIn, onZoomOut, onZoomReset,
}) {
  return (
    <div className="toolbar">
      <Folio
        pageIndex={drawing.pageIndex}
        pageCount={drawing.pageCount}
        canAddPage={drawing.canAddPage}
        onPrev={onPrevPage}
        onNext={onNextPage}
        onAdd={onAddPage}
        zoom={view.scale}
        onZoomOut={onZoomOut}
        onZoomIn={onZoomIn}
        onZoomReset={onZoomReset}
      />
      <div className="toolbar__row">
      <ColorPicker
        value={style.color}
        byColor={byColor}
        onChange={(color) => setStyle((s) => ({ ...s, color }))}
      />
      <WidthPicker
        value={style.width}
        color={style.color}
        onChange={(width) => setStyle((s) => ({ ...s, width }))}
      />
      </div>
      <div className="toolbar__row toolbar__row--shapes">
        <ShapePicker
          value={style.shape}
          onChange={(shape) => setStyle((s) => ({ ...s, shape }))}
        />
      </div>
      <div className="toolbar__row">
      <div className="toolbar__group">
        <ToolButton
          label="Մատիտ" active={style.pencil}
          onPress={() => setStyle((s) => ({ ...s, pencil: true }))}
        >✎</ToolButton>
        <ToolButton
          label="Գրիչ" active={!style.pencil}
          onPress={() => setStyle((s) => ({ ...s, pencil: false }))}
        >✒</ToolButton>
      </div>
      <div className="toolbar__group">
        <ToolButton label="Հետ" disabled={!drawing.canUndo} onPress={drawing.undo}>↩</ToolButton>
        <ToolButton label="Առաջ" disabled={!drawing.canRedo} onPress={drawing.redo}>↪</ToolButton>
      </div>
      <div className="toolbar__group">
        <ToolButton
          label="Տպել" onPress={() => onPrint(true)} onLongPress={() => onPrint(false)}
        >⎙</ToolButton>
        <ToolButton label="Ներբեռնել SVG" onPress={onExport}>↓</ToolButton>
        <ClearButton disabled={!drawing.canUndo} onClear={drawing.clear} />
      </div>
      </div>
    </div>
  )
}

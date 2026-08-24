import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDrawing } from '../useDrawing.js'

const STYLE = { color: '#1f3a6e', width: 2.2, pencil: false }
const P = (x, y) => ({ x, y })

/** Attach a real <path> so the live-stroke DOM writes have somewhere to land. */
function withLive(result) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  result.current.liveRef.current = path
  return path
}

const draw = (result, points, style = STYLE) => {
  act(() => {
    result.current.begin(points[0], style)
    result.current.extend(points.slice(1))
    result.current.commit()
  })
}

describe('drawing a stroke', () => {
  it('commits one stroke', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(10, 10)])
    expect(result.current.strokes).toHaveLength(1)
  })

  it('records the style it was drawn with', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(5, 5)], { color: '#b23a48', width: 5.2, pencil: true })
    expect(result.current.strokes[0]).toMatchObject({ color: '#b23a48', width: 5.2, pencil: true })
  })

  it('is per-stroke: a later pen stroke does not rewrite an earlier pencil one', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)], { ...STYLE, pencil: true })
    draw(result, [P(2, 2), P(3, 3)], { ...STYLE, pencil: false })
    expect(result.current.strokes.map((s) => s.pencil)).toEqual([true, false])
  })

  it('gives every stroke a unique id', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)])
    draw(result, [P(2, 2), P(3, 3)])
    const [a, b] = result.current.strokes
    expect(a.id).not.toBe(b.id)
  })

  it('commits a single tap as a dot', () => {
    const { result } = renderHook(() => useDrawing())
    act(() => {
      result.current.begin(P(20, 20), STYLE)
      result.current.commit()
    })
    expect(result.current.strokes[0].d).toBe('M 20 20 l 0 0')
  })

  it('commits nothing when nothing was begun', () => {
    const { result } = renderHook(() => useDrawing())
    act(() => { result.current.commit() })
    expect(result.current.strokes).toHaveLength(0)
  })
})

describe('the live stroke bypasses React', () => {
  it('writes d directly to the node during a drag, without a commit', () => {
    const { result } = renderHook(() => useDrawing())
    const path = withLive(result)

    act(() => {
      result.current.begin(P(0, 0), STYLE)
      result.current.extend([P(10, 0), P(20, 10)])
    })

    expect(path.getAttribute('d')).toContain('M 0 0')
    // Nothing has entered state yet — that is the entire point.
    expect(result.current.strokes).toHaveLength(0)
  })

  it('sets the live stroke style on begin', () => {
    const { result } = renderHook(() => useDrawing())
    const path = withLive(result)
    act(() => result.current.begin(P(0, 0), { color: '#b23a48', width: 5.2, pencil: false }))
    expect(path.getAttribute('stroke')).toBe('#b23a48')
    expect(path.getAttribute('stroke-width')).toBe('5.2')
  })

  it('clears the live node on commit so the stroke does not render twice', () => {
    const { result } = renderHook(() => useDrawing())
    const path = withLive(result)
    draw(result, [P(0, 0), P(9, 9)])
    expect(path.getAttribute('d')).toBe('')
  })

  it('ignores extend when no stroke is in flight', () => {
    const { result } = renderHook(() => useDrawing())
    act(() => result.current.extend([P(1, 1)]))
    expect(result.current.isDrawing()).toBe(false)
  })

  it('accepts a bare point as well as a batch of coalesced samples', () => {
    const { result } = renderHook(() => useDrawing())
    withLive(result)
    act(() => {
      result.current.begin(P(0, 0), STYLE)
      result.current.extend(P(5, 5))
      result.current.commit()
    })
    expect(result.current.strokes[0].d).toBe('M 0 0 L 5 5')
  })
})

describe('cancel', () => {
  it('abandons the stroke in flight, so a triple-tap does not also draw dots', () => {
    const { result } = renderHook(() => useDrawing())
    const path = withLive(result)
    act(() => {
      result.current.begin(P(10, 10), STYLE)
      result.current.cancel()
      result.current.commit()
    })
    expect(result.current.strokes).toHaveLength(0)
    expect(path.getAttribute('d')).toBe('')
  })
})

describe('history', () => {
  it('undoes the last stroke', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)])
    draw(result, [P(2, 2), P(3, 3)])
    act(() => { result.current.undo() })
    expect(result.current.strokes).toHaveLength(1)
  })

  it('redoes it', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)])
    act(() => { result.current.undo() })
    act(() => { result.current.redo() })
    expect(result.current.strokes).toHaveLength(1)
  })

  it('reports what is available', () => {
    const { result } = renderHook(() => useDrawing())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
    draw(result, [P(0, 0), P(1, 1)])
    expect(result.current.canUndo).toBe(true)
    act(() => { result.current.undo() })
    expect(result.current.canRedo).toBe(true)
  })

  it('drops the redo stack once a new stroke is drawn', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)])
    act(() => { result.current.undo() })
    draw(result, [P(5, 5), P(6, 6)])
    expect(result.current.canRedo).toBe(false)
  })

  it('undoes past the beginning without throwing', () => {
    const { result } = renderHook(() => useDrawing())
    act(() => { result.current.undo(); result.current.undo() })
    expect(result.current.strokes).toEqual([])
  })

  it('redoes past the end without throwing', () => {
    const { result } = renderHook(() => useDrawing())
    act(() => { result.current.redo() })
    expect(result.current.strokes).toEqual([])
  })
})

describe('clear', () => {
  it('empties the page', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)])
    act(() => { result.current.clear() })
    expect(result.current.strokes).toEqual([])
  })

  it('is recoverable — cleared strokes go into redo, never into nothing', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)])
    draw(result, [P(2, 2), P(3, 3)])
    act(() => { result.current.clear() })
    expect(result.current.canRedo).toBe(true)
    act(() => { result.current.redo() })
    act(() => { result.current.redo() })
    expect(result.current.strokes).toHaveLength(2)
  })
})

describe('stats', () => {
  it('counts strokes', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)])
    expect(result.current.stats.strokes).toBe(1)
  })

  it('measures drawn length in grid cells', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(240, 0)]) // 240px = 10 cells
    expect(result.current.stats.cells).toBe(10)
  })

  it('tracks how much of the drawing each colour holds', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(100, 0)], { ...STYLE, color: '#1f3a6e' })
    draw(result, [P(0, 0), P(50, 0)], { ...STYLE, color: '#b23a48' })
    expect(result.current.stats.byColor['#1f3a6e']).toBeGreaterThan(
      result.current.stats.byColor['#b23a48'],
    )
  })

  it('reports the pencil share', () => {
    const { result } = renderHook(() => useDrawing())
    draw(result, [P(0, 0), P(1, 1)], { ...STYLE, pencil: true })
    draw(result, [P(0, 0), P(1, 1)], { ...STYLE, pencil: false })
    expect(result.current.stats.pencilShare).toBe(0.5)
  })

  it('is all zeroes on a blank page', () => {
    const { result } = renderHook(() => useDrawing())
    expect(result.current.stats).toMatchObject({ strokes: 0, cells: 0, pencilShare: 0 })
  })
})

describe('restore', () => {
  it('brings back a saved drawing', () => {
    const { result } = renderHook(() => useDrawing())
    act(() => {
      result.current.restore({ strokes: [{ id: 'x', d: 'M 0 0 L 1 1', color: '#000', width: 2 }] })
    })
    expect(result.current.strokes).toHaveLength(1)
  })

  it('ignores junk', () => {
    const { result } = renderHook(() => useDrawing())
    let ok
    act(() => { ok = result.current.restore(null) })
    expect(ok).toBe(false)
  })
})

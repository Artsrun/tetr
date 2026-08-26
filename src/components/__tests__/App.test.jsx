import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App.jsx'
import { STORAGE_KEY, TRIPLE_TAP_RADIUS } from '../../lib/constants.js'

const paper = () => document.querySelector('.paper')
const pointer = (type, x, y) =>
  new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y })

const tap = (x, y) => {
  fireEvent(paper(), pointer('pointerdown', x, y))
  fireEvent(paper(), pointer('pointerup', x, y))
}

const stroke = (from, to) => {
  fireEvent(paper(), pointer('pointerdown', from[0], from[1]))
  fireEvent(paper(), pointer('pointermove', to[0], to[1]))
  fireEvent(paper(), pointer('pointerup', to[0], to[1]))
}

const press = (label) =>
  fireEvent(screen.getByLabelText(label), new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

const committed = () => document.querySelectorAll('.strokes path')

beforeEach(() => localStorage.clear())

describe('drawing', () => {
  it('commits a stroke to the page', () => {
    render(<App />)
    stroke([20, 20], [120, 200])
    expect(committed()).toHaveLength(1)
  })

  it('commits a tap as a dot', () => {
    render(<App />)
    tap(60, 60)
    expect(committed()).toHaveLength(1)
  })

  it('draws in the selected colour', () => {
    render(<App />)
    press('Կարմիր')
    stroke([10, 10], [100, 100])
    expect(committed()[0].getAttribute('stroke')).toBe('#b23a48')
  })

  it('draws at the selected width', () => {
    render(<App />)
    press('5.2px')
    stroke([10, 10], [100, 100])
    expect(committed()[0].getAttribute('stroke-width')).toBe('5.2')
  })
})

describe('undo, redo and clear', () => {
  it('undoes', () => {
    render(<App />)
    stroke([10, 10], [50, 50])
    press('Հետ')
    expect(committed()).toHaveLength(0)
  })

  it('redoes', () => {
    render(<App />)
    stroke([10, 10], [50, 50])
    press('Հետ')
    press('Առաջ')
    expect(committed()).toHaveLength(1)
  })

  it('needs two presses to clear', () => {
    render(<App />)
    stroke([10, 10], [50, 50])
    press('Ջնջել')
    expect(committed()).toHaveLength(1)
    press('Հաստատել ջնջումը')
    expect(committed()).toHaveLength(0)
  })

  it('brings a cleared drawing back — losing it is the worst thing this app could do', () => {
    render(<App />)
    stroke([10, 10], [50, 50])
    press('Ջնջել')
    press('Հաստատել ջնջումը')
    press('Առաջ')
    expect(committed()).toHaveLength(1)
  })
})

describe('keyboard on desktop', () => {
  it('undoes with ⌘Z', () => {
    render(<App />)
    stroke([10, 10], [50, 50])
    fireEvent.keyDown(window, { key: 'z', metaKey: true })
    expect(committed()).toHaveLength(0)
  })

  it('redoes with ⇧⌘Z', () => {
    render(<App />)
    stroke([10, 10], [50, 50])
    fireEvent.keyDown(window, { key: 'z', metaKey: true })
    fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true })
    expect(committed()).toHaveLength(1)
  })

  it('ignores an unmodified z, which is just a keypress', () => {
    render(<App />)
    stroke([10, 10], [50, 50])
    fireEvent.keyDown(window, { key: 'z' })
    expect(committed()).toHaveLength(1)
  })
})

describe('export', () => {
  it('downloads a timestamped SVG serialized from state', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()

    render(<App />)
    stroke([10, 10], [100, 100])
    press('Ներբեռնել SVG')

    expect(click).toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalled()
    click.mockRestore()
  })
})

describe('the triple-tap easter egg', () => {
  it('brings out the ruler on the third tap', () => {
    render(<App />)
    tap(100, 100)
    tap(104, 98)
    tap(101, 103)
    expect(document.querySelector('.instruments')).toBeTruthy()
  })

  it('does not commit three dots along with it', () => {
    render(<App />)
    tap(100, 100)
    tap(104, 98)
    tap(101, 103)
    // Two dots from the first two taps; the third is consumed by the gesture.
    expect(committed()).toHaveLength(2)
  })

  it('stays away for two taps — three dots is a legitimate thing to draw', () => {
    render(<App />)
    tap(100, 100)
    tap(102, 102)
    expect(document.querySelector('.instruments')).toBeNull()
  })

  it('stays away when the taps are spread out', () => {
    render(<App />)
    tap(100, 100)
    tap(100 + TRIPLE_TAP_RADIUS * 3, 100)
    tap(100, 100)
    expect(document.querySelector('.instruments')).toBeNull()
  })

  it('cycles ruler → calliper → away', () => {
    render(<App />)
    const triple = (x, y) => { tap(x, y); tap(x + 2, y); tap(x, y + 2) }

    triple(100, 100)
    expect(document.querySelector('.instrument__body')).toBeTruthy()
    triple(300, 400)
    expect(document.querySelector('.instrument__body')).toBeTruthy()
    triple(150, 500)
    expect(document.querySelector('.instruments')).toBeNull()
  })

  it('renders instruments in a sibling svg, never on the paper', () => {
    render(<App />)
    tap(100, 100); tap(102, 100); tap(100, 102)
    expect(paper().querySelector('.instrument__body')).toBeNull()
    expect(document.querySelector('.instruments .instrument__body')).toBeTruthy()
  })
})

describe('persistence', () => {
  it('autosaves the drawing', async () => {
    render(<App />)
    stroke([10, 10], [90, 90])
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy(), { timeout: 2000 })
  })

  it('saves the path but not the points', async () => {
    render(<App />)
    stroke([10, 10], [90, 90])
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy(), { timeout: 2000 })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.strokes[0].d).toBeTruthy()
    expect(saved.strokes[0].points).toBeUndefined()
  })

  it('restores a drawing on load', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: 1, at: Date.now(),
      strokes: [{ id: 'r1', d: 'M 0 0 L 40 40', color: '#1f3a6e', width: 2.2, pencil: true }],
    }))
    render(<App />)
    expect(committed()).toHaveLength(1)
  })
})

describe('the install banner', () => {
  it('waits until something is drawn', () => {
    render(<App />)
    expect(screen.queryByLabelText('Փակել')).toBeNull()
  })
})

describe('stats', () => {
  it('counts what has been drawn', () => {
    render(<App />)
    stroke([0, 0], [240, 0])
    expect(screen.getByLabelText('Բացել վիճակագրությունը').textContent).toContain('1')
  })

  it('expands on tap', () => {
    render(<App />)
    press('Բացել վիճակագրությունը')
    expect(screen.getByText('Վանդակ')).toBeInTheDocument()
  })

  it('mutes', () => {
    render(<App />)
    press('Անջատել ձայնը')
    expect(screen.getByLabelText('Միացնել ձայնը')).toBeInTheDocument()
  })
})

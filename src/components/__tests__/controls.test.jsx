import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ClearButton from '../ClearButton.jsx'
import ColorPicker from '../ColorPicker.jsx'
import ToolButton from '../ToolButton.jsx'
import WidthPicker from '../WidthPicker.jsx'
import { COLORS, WIDTHS } from '../../lib/constants.js'

// The components listen for pointerdown, not click — mobile browsers hold a
// click 50-300ms waiting on double-tap.
const press = (el) => fireEvent(el, new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

describe('ToolButton', () => {
  it('fires on pointerdown, not on click', () => {
    const onPress = vi.fn()
    render(<ToolButton label="X" onPress={onPress}>X</ToolButton>)
    press(screen.getByLabelText('X'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not fire again on the click that follows the same tap', () => {
    const onPress = vi.fn()
    render(<ToolButton label="X" onPress={onPress}>X</ToolButton>)
    const el = screen.getByLabelText('X')
    press(el)
    fireEvent.click(el)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('stays silent when disabled', () => {
    const onPress = vi.fn()
    render(<ToolButton label="X" disabled onPress={onPress}>X</ToolButton>)
    press(screen.getByLabelText('X'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('exposes pressed state to assistive tech', () => {
    render(<ToolButton label="X" active onPress={() => {}}>X</ToolButton>)
    expect(screen.getByLabelText('X')).toHaveAttribute('aria-pressed', 'true')
  })

  it('is reachable by keyboard on desktop', () => {
    const onPress = vi.fn()
    render(<ToolButton label="X" onPress={onPress}>X</ToolButton>)
    fireEvent.keyDown(screen.getByLabelText('X'), { key: 'Enter' })
    expect(onPress).toHaveBeenCalled()
  })
})

describe('ToolButton long-press', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires the long-press after the hold and suppresses the short press', () => {
    const onPress = vi.fn()
    const onLongPress = vi.fn()
    render(<ToolButton label="P" onPress={onPress} onLongPress={onLongPress}>P</ToolButton>)

    press(screen.getByLabelText('P'))
    act(() => { vi.advanceTimersByTime(600) })
    fireEvent(document, new PointerEvent('pointerup', { bubbles: true }))

    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('fires the short press when released early', () => {
    const onPress = vi.fn()
    const onLongPress = vi.fn()
    render(<ToolButton label="P" onPress={onPress} onLongPress={onLongPress}>P</ToolButton>)

    press(screen.getByLabelText('P'))
    act(() => { vi.advanceTimersByTime(120) })
    fireEvent(document, new PointerEvent('pointerup', { bubbles: true }))

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onLongPress).not.toHaveBeenCalled()
  })
})

describe('ClearButton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not clear on the first press — it arms', () => {
    const onClear = vi.fn()
    render(<ClearButton onClear={onClear} />)
    press(screen.getByLabelText('Ջնջել'))
    expect(onClear).not.toHaveBeenCalled()
  })

  it('clears on the second press', () => {
    const onClear = vi.fn()
    render(<ClearButton onClear={onClear} />)
    press(screen.getByLabelText('Ջնջել'))
    press(screen.getByLabelText('Հաստատել ջնջումը'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('auto-disarms at 3s, so a stray press much later is harmless', () => {
    const onClear = vi.fn()
    render(<ClearButton onClear={onClear} />)
    press(screen.getByLabelText('Ջնջել'))
    act(() => { vi.advanceTimersByTime(3100) })
    expect(screen.getByLabelText('Ջնջել')).toBeInTheDocument()
    press(screen.getByLabelText('Ջնջել'))
    expect(onClear).not.toHaveBeenCalled()
  })

  it('shows it is armed', () => {
    render(<ClearButton onClear={() => {}} />)
    press(screen.getByLabelText('Ջնջել'))
    expect(screen.getByLabelText('Հաստատել ջնջումը')).toHaveClass('is-armed')
  })
})

describe('ColorPicker', () => {
  it('offers every ink', () => {
    render(<ColorPicker value={COLORS[0].hex} onChange={() => {}} />)
    for (const c of COLORS) expect(screen.getByLabelText(c.label)).toBeInTheDocument()
  })

  it('reports the chosen colour', () => {
    const onChange = vi.fn()
    render(<ColorPicker value={COLORS[0].hex} onChange={onChange} />)
    press(screen.getByLabelText(COLORS[2].label))
    expect(onChange).toHaveBeenCalledWith(COLORS[2].hex)
  })

  it('marks the active swatch', () => {
    render(<ColorPicker value={COLORS[1].hex} onChange={() => {}} />)
    expect(screen.getByLabelText(COLORS[1].label)).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows each colour’s share of the drawing on its ring', () => {
    const byColor = { [COLORS[0].hex]: 75, [COLORS[1].hex]: 25 }
    render(<ColorPicker value={COLORS[0].hex} onChange={() => {}} byColor={byColor} />)
    expect(screen.getByLabelText(COLORS[0].label).style.getPropertyValue('--share')).toBe('0.75')
  })
})

describe('WidthPicker', () => {
  it('offers every width', () => {
    render(<WidthPicker value={WIDTHS[0]} color="#000" onChange={() => {}} />)
    for (const w of WIDTHS) expect(screen.getByLabelText(`${w}px`)).toBeInTheDocument()
  })

  it('renders each dot at the actual stroke size', () => {
    render(<WidthPicker value={WIDTHS[0]} color="#000" onChange={() => {}} />)
    const dots = document.querySelectorAll('.width__dot')
    const sizes = [...dots].map((d) => parseFloat(d.style.width))
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
  })

  it('reports the chosen width', () => {
    const onChange = vi.fn()
    render(<WidthPicker value={WIDTHS[0]} color="#000" onChange={onChange} />)
    press(screen.getByLabelText(`${WIDTHS[3]}px`))
    expect(onChange).toHaveBeenCalledWith(WIDTHS[3])
  })
})

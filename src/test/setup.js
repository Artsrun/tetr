import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom implements none of these, and the components are built on all three.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 1
      this.pointerType = params.pointerType ?? 'touch'
      this.pressure = params.pressure ?? 0.5
      this.isPrimary = params.isPrimary ?? true
    }
    getCoalescedEvents() {
      return []
    }
  }
  window.PointerEvent = PointerEvent
  global.PointerEvent = PointerEvent
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
}

if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 })
}

// jsdom defaults to a 1024×768 desktop window. This app is a phone app — the
// instruments, the toolbar wrap and every tap coordinate depend on it — so the
// test viewport is a phone, and it matches the rect stub below.
Object.defineProperty(window, 'innerWidth', { value: 390, writable: true, configurable: true })
Object.defineProperty(window, 'innerHeight', { value: 700, writable: true, configurable: true })

// A real AudioContext in jsdom would be a stub anyway; the engine is expected
// to degrade silently when the constructor is missing, which is what we test.
Element.prototype.getBoundingClientRect = function () {
  return { left: 0, top: 0, right: 390, bottom: 700, width: 390, height: 700, x: 0, y: 0 }
}

afterEach(() => cleanup())

// Design tokens. Mirrored in index.css — see CLAUDE.md: the export serializes
// from state, so every value it writes must exist as a literal in JS, not only
// as a CSS custom property that resolves to nothing outside the page.

export const PAPER = '#efe9d8'
export const GRID = '#9fb3c8'
export const GRID_SIZE = 24 // px between grid lines
export const GRID_WIDTH = 0.5
export const MARGIN_LINE = '#c98b8b'

export const INK = {
  blue: '#1f3a6e',
  black: '#20222a',
  red: '#b23a48',
  green: '#2f6b4a',
  violet: '#6b4a8f',
}

export const COLORS = [
  { id: 'blue', hex: INK.blue, label: 'Կապույտ' },
  { id: 'black', hex: INK.black, label: 'Սև' },
  { id: 'red', hex: INK.red, label: 'Կարմիր' },
  { id: 'green', hex: INK.green, label: 'Կանաչ' },
  { id: 'violet', hex: INK.violet, label: 'Մանուշակ' },
]

export const WIDTHS = [1.4, 2.2, 3.4, 5.2]

export const DEFAULT_COLOR = COLORS[0].hex
export const DEFAULT_WIDTH = WIDTHS[1]

// Stroke rendering
export const LINECAP = 'round'
export const LINEJOIN = 'round'

// Pencil: stroke-opacity carried into the export; the feTurbulence filter is
// screen-only (CLAUDE.md — filters rasterize on import).
export const PENCIL_OPACITY = 0.72
export const PEN_OPACITY = 1

// Gestures
export const TRIPLE_TAP_MS = 600
export const TRIPLE_TAP_RADIUS = 30
export const TAP_DRAG_LIMIT = 6 // beyond this a tap is a drag

// Clear
export const CLEAR_ARM_MS = 3000

// Instruments
export const SNAP_DISTANCE = 18 // px from the ruler edge before a point snaps
export const ANGLE_DETENT = 15 // degrees
export const ANGLE_TOLERANCE = 4 // engage only within this of a detent

// Print — A4 at 96dpi, 10mm margin
export const A4 = { width: 794, height: 1123, margin: 38 }

export const STORAGE_KEY = 'tetr:v1'

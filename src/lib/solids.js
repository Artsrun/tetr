// Pure math — no DOM, no React. Same contract as geometry.js and shapes.js.
//
// Five school solids in cabinet projection: depth runs up-right at 45°, at
// half scale. That is the projection every Soviet geometry textbook draws by
// hand, and it is the only one whose depth lands on grid intersections — the
// figure sits on the notebook instead of floating over it.
//
// A solid is ink, not an object (shapes.js): it commits as one stroke `d` with
// several subpaths, so undo, export, print and persistence never learn it is
// 3D. Hidden edges are simply not drawn — a dashed edge would need a second
// stroke style, and the export carries one dash pattern per path.

import { GRID_SIZE } from './constants.js'
import { dist, pathLength, round } from './geometry.js'

export const SHAPE_CUBE = 'cube'
export const SHAPE_CYLINDER = 'cylinder'
export const SHAPE_CONE = 'cone'
export const SHAPE_SPHERE = 'sphere'
export const SHAPE_PYRAMID = 'pyramid'

/** Depth is half the shorter side — cabinet projection, not isometric. */
export const DEPTH_RATIO = 0.5

/** How flat a circle lies when the page is seen from above. */
export const ELLIPSE_RATIO = 0.34

const M = (p) => `M ${round(p.x)} ${round(p.y)}`
const L = (p) => `L ${round(p.x)} ${round(p.y)}`

const poly = (pts, closed = false) =>
  pts.map((p, i) => (i ? L(p) : M(p))).join(' ') + (closed ? ' Z' : '')

// SVG y grows downward, so sweep 1 lifts the arc over the top of the ellipse
// and sweep 0 drops it under the bottom — the near half of a base.
const halfArc = (from, to, rx, ry, sweep) =>
  `${M(from)} A ${round(rx)} ${round(ry)} 0 0 ${sweep} ${round(to.x)} ${round(to.y)}`

const fullEllipse = (cx, cy, rx, ry) => {
  const left = { x: cx - rx, y: cy }
  const right = { x: cx + rx, y: cy }
  return `${halfArc(left, right, rx, ry, 1)} A ${round(rx)} ${round(ry)} 0 0 1 ` +
    `${round(left.x)} ${round(left.y)}`
}

// `points` is what the rubber hit-tests against, and hit.js reads it as one
// polyline — so every solid lists its vertices in the order the pen visits
// them. Jump between subpaths in the wrong order and the rubber starts
// catching diagonals that were never drawn.
/** Same approximation shapes.js uses for the flat ellipse — stats stay consistent. */
const ellipseLength = (rx, ry) => 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)

// Angles run in screen space, where y grows downward: 0 is the right of the
// ellipse, π/2 its bottom, π its left.
const RIGHT = 0
const LEFT = Math.PI

/** An arc as vertices, for the rubber. Never for the `d` — that keeps real arcs. */
const arcPoints = (cx, cy, rx, ry, from, to, steps = 12) => {
  const out = []
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps
    out.push({ x: round(cx + Math.cos(a) * rx), y: round(cy + Math.sin(a) * ry) })
  }
  return out
}

const ellipsePoints = (cx, cy, rx, ry) =>
  arcPoints(cx, cy, rx, ry, LEFT, LEFT + 2 * Math.PI)

/** Snapped so the back face lands on grid intersections, never below one cell. */
export function depthOf(w, h, grid = GRID_SIZE) {
  const raw = Math.min(w, h) * DEPTH_RATIO
  return Math.max(grid, Math.round(raw / grid) * grid)
}

function cube({ x, y, w, h }, d) {
  const front = [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
  ]
  const back = front.map((p) => ({ x: p.x + d, y: p.y - d }))
  const top = [front[0], back[0], back[1], front[1]]
  const side = [back[1], back[2], front[2]]
  return {
    d: [poly(front, true), poly(top), poly(side)].join(' '),
    points: [...front, front[0], ...top, ...side],
    length: pathLength([...front, front[0]]) + pathLength(top) + pathLength(side),
  }
}

function pyramid({ x, y, w, h }, d) {
  // Same rule as the cube: the corner behind the solid is drawn as nothing.
  // Here that is the back-left one, so what is left is the silhouette plus the
  // single lateral edge that runs down the front-right — exactly the four
  // lines a textbook pyramid is made of.
  const fl = { x, y: y + h }
  const fr = { x: x + w, y: y + h }
  const br = { x: x + w + d, y: y + h - d }
  const apex = { x: x + w / 2 + d / 2, y }
  const shell = [apex, fl, fr, br]
  return {
    d: [poly(shell, true), poly([apex, fr])].join(' '),
    points: [...shell, apex, fr],
    length: pathLength([...shell, apex]) + dist(apex, fr),
  }
}

function cylinder({ x, y, w, h }) {
  const rx = w / 2
  // Never let the two bases meet: a squat cylinder still reads as a cylinder.
  const ry = Math.min(rx * ELLIPSE_RATIO, h / 4)
  if (rx < 0.5 || ry < 0.5) return null
  const cx = x + rx
  const top = y + ry
  const bottom = y + h - ry
  const left = { x, y: top }
  const right = { x: x + w, y: top }
  const bl = { x, y: bottom }
  const br = { x: x + w, y: bottom }
  return {
    d: [
      fullEllipse(cx, top, rx, ry),
      poly([left, bl]),
      poly([right, br]),
      halfArc(bl, br, rx, ry, 0), // only the near half of the base is visible
    ].join(' '),
    points: [
      ...ellipsePoints(cx, top, rx, ry),
      bl,
      ...arcPoints(cx, bottom, rx, ry, LEFT, RIGHT, 6), // the near half only
      right,
    ],
    length: ellipseLength(rx, ry) * 1.5 + 2 * (bottom - top),
  }
}

function cone({ x, y, w, h }) {
  const rx = w / 2
  const ry = Math.min(rx * ELLIPSE_RATIO, h / 3)
  if (rx < 0.5 || ry < 0.5) return null
  const cx = x + rx
  const cy = y + h - ry
  const apex = { x: cx, y }
  const left = { x, y: cy }
  const right = { x: x + w, y: cy }
  return {
    d: [
      fullEllipse(cx, cy, rx, ry),
      poly([apex, left]),
      poly([apex, right]),
    ].join(' '),
    points: [...ellipsePoints(cx, cy, rx, ry), apex, right],
    length: ellipseLength(rx, ry) + 2 * dist(apex, left),
  }
}

function sphere({ x, y, w, h }) {
  // A sphere is round whatever box you drag it in — the shorter side wins.
  const r = Math.min(w, h) / 2
  if (r < 0.5) return null
  const cx = x + w / 2
  const cy = y + h / 2
  const ry = Math.max(r * ELLIPSE_RATIO, 0.5)
  return {
    d: [fullEllipse(cx, cy, r, r), fullEllipse(cx, cy, r, ry)].join(' '),
    points: [...ellipsePoints(cx, cy, r, r), ...ellipsePoints(cx, cy, r, ry)],
    length: 2 * Math.PI * r + ellipseLength(r, ry),
  }
}

const BUILDERS = {
  [SHAPE_CUBE]: cube,
  [SHAPE_CYLINDER]: cylinder,
  [SHAPE_CONE]: cone,
  [SHAPE_SPHERE]: sphere,
  [SHAPE_PYRAMID]: pyramid,
}

export const SOLIDS = [
  { id: SHAPE_CUBE, label: 'Խորանարդ' },
  { id: SHAPE_CYLINDER, label: 'Գլան' },
  { id: SHAPE_CONE, label: 'Կոն' },
  { id: SHAPE_SPHERE, label: 'Գունդ' },
  { id: SHAPE_PYRAMID, label: 'Բուրգ' },
]

export const isSolid = (id) => Object.hasOwn(BUILDERS, id)

/**
 * Build one of the solids from a grid-snapped box. Returns null for a box too
 * small to read as a figure — the caller commits nothing rather than a smudge.
 */
export function solidFromBox(kind, box, grid = GRID_SIZE) {
  const build = BUILDERS[kind]
  if (!build) return null
  if (box.w < 1 && box.h < 1) return null
  return build(box, depthOf(box.w, box.h, grid))
}

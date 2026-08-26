// Graphite texture: an SVG filter displacing the stroke edge, not a canvas or
// WebGL renderer (CLAUDE.md). WebGL would look better and would also destroy
// the vector export, which is the entire point of the gift. It degrades to a
// clean line wherever filters are slow.
//
// The filter stays in <defs> even when pencil is off — adding and removing it
// forces Safari to re-rasterize every stroke on toggle.

export const PENCIL_FILTER_ID = 'tetr-pencil'

export const PENCIL_FILTER = {
  id: PENCIL_FILTER_ID,
  baseFrequency: 0.9,
  numOctaves: 3,
  seed: 7,
  scale: 1.6,
}

/** The filter is screen-only; the export carries stroke-opacity instead. */
export const filterRef = (pencil) => (pencil ? `url(#${PENCIL_FILTER_ID})` : undefined)

// Two editions, one bundle. `?v=2` opens the rebrand; anything else is the
// notebook as it shipped. One bundle rather than two builds because the app is
// ~65KB total and a second deploy target would cost more than the branch does
// — and because a stranger with a link must be able to see both.
//
// Everything an edition changes lives in this table. The paper, the grid and
// the stroke itself are NOT in it: a rebrand changes the cover, never the line.

export const V1 = 'v1'
export const V2 = 'v2'

export const EDITIONS = {
  [V1]: {
    id: V1,
    query: '1',
    name: 'Տետր',
    mark: '🦊',
    title: 'Տետր 🦊',
    tagline: 'Վանդակավոր տետր՝ գրպանում',
    themeColor: '#efe9d8',
    spreadOnOpen: false,
  },
  [V2]: {
    id: V2,
    query: '2',
    name: 'Երկրաչափ',
    mark: '📐',
    title: 'Երկրաչափ · Տետր 📐',
    tagline: 'Տետր, որը բացատրում է անկյունն ու չափը',
    themeColor: '#e6e3d5',
    spreadOnOpen: true,
  },
}

export const EDITION_IDS = Object.keys(EDITIONS)

/** `?v=2`, `?v=v2` and `?version=2` all mean the same thing. */
export function editionFrom(search = '') {
  const raw = String(search || '').replace(/^\?/, '')
  const q = new URLSearchParams(raw)
  const want = (q.get('v') ?? q.get('version') ?? '').trim().toLowerCase()
  if (!want) return EDITIONS[V1]
  return (
    EDITION_IDS.map((id) => EDITIONS[id]).find((e) => want === e.query || want === e.id) ||
    EDITIONS[V1]
  )
}

export const currentEdition = () =>
  editionFrom(typeof location === 'undefined' ? '' : location.search)

export const isV2 = (edition) => edition?.id === V2

/** The other edition — what the cover-flip button switches to. */
export const otherEdition = (edition) => (isV2(edition) ? EDITIONS[V1] : EDITIONS[V2])

/** A link that keeps every other query param intact. v1 drops `v` entirely. */
export function editionHref(edition, url = typeof location === 'undefined' ? '/' : location.href) {
  const u = new URL(url, 'http://x')
  u.searchParams.delete('version')
  if (edition.id === V1) u.searchParams.delete('v')
  else u.searchParams.set('v', edition.query)
  return `${u.pathname}${u.search}${u.hash}`
}

/**
 * Title, theme-colour and the `data-edition` hook the stylesheet reads. The
 * DOM is touched once, at mount — the edition never changes without a reload.
 */
export function applyEdition(edition, doc = typeof document === 'undefined' ? null : document) {
  if (!doc || !edition) return false
  doc.documentElement?.setAttribute('data-edition', edition.id)
  doc.title = edition.title
  const meta = doc.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', edition.themeColor)
  return true
}

# Տետր — AI working notes

Digital Soviet grid notebook. Draw with a finger, export real SVG. Mobile-first,
offline, no accounts, no cloud, no tracking.

## The one rule

**This is a gift, not a product.** Every decision optimises for the moment
someone opens it on a phone and draws a line. If a change makes that line feel
worse, it's the wrong change — no matter what else it improves.

## Stack

React 19 · Vite 6 · Vitest 3 · plain CSS. Zero runtime dependencies beyond React.

Adding a dependency needs a real argument. The whole app gzips to ~65KB and
should stay there.

## Architecture

```
src/
  lib/geometry.js   pure math — no DOM, no React. Test everything here.
  lib/export.js     SVG serialization from state (NOT DOM cloning — see below)
  lib/print.js      A4 document built in a hidden iframe
  lib/sound.js      all audio, synthesized — there is no audio file in this repo
  hooks/usePWA      service worker, install prompt, offline state
  hooks/usePersist  autosave to localStorage
  lib/pencil.js     graphite texture — SVG filter, not WebGL
  lib/instruments   ruler/calliper math (the triple-tap easter egg)
  lib/gestures.js   triple-tap tracker — strict on purpose, see below
  lib/constants.js  design tokens, mirrored in index.css
  hooks/useDrawing  all stroke state, history, derived stats
  components/       one control per file, all built on ToolButton
```

## Things that look wrong but are deliberate

Change these only with a reason better than the one written here.

**The live stroke bypasses React.** `useDrawing` mutates a `<path>` node
directly via `liveRef` during a drag. Pointermove fires up to 120×/sec; a
setState per event means a reconcile per event and the line visibly trails the
finger. Committed strokes render from state normally.

**Export serializes from state, not the DOM.** Cloning the live SVG would carry
`var(--grid)` into the file, which resolves to nothing outside the page — Figma
opens a blank rectangle. Every value in the export is a literal. This is why
constants exist in both JS and CSS.

**Buttons fire on `pointerdown`.** Mobile browsers hold a click ~50-300ms
waiting on double-tap. On a tool this direct, that delay reads as breakage.

**`touch-action: none` on the SVG, `overscroll-behavior: none` on body.**
Without both, a downward stroke scrolls the page or triggers pull-to-refresh.

**Clear is two-step and still recoverable.** It sits a thumb-width from undo.
First press arms, second commits, auto-disarms at 3s — and the hook routes
cleared strokes into redo anyway. Losing someone's drawing is the worst thing
this app could do.

**Catmull-Rom, not quadratic midpoint smoothing.** Catmull-Rom interpolates —
the curve passes through every recorded point. Approximating splines drift
inside sharp corners, which feels like the app fighting you.

**Every sound is synthesized. There is no audio file in this repo and there
must never be one.** Seven cues built from oscillators and generated noise.
Three reasons: nothing licensed, zero bytes shipped, and it works offline by
construction — a PWA that fetches audio has a cue that fails on a plane.
Do not "improve" this with samples.

**Audio unlocks on the first pointerdown anywhere.** iOS refuses to start an
AudioContext outside a user gesture, so priming it on first touch means the
first real cue isn't the one that's silent.

**Mute is engine state, not a prop.** Every control calls `play()` directly;
one guard inside the engine beats threading a flag through six components.

**The service worker is hand-written.** A PWA plugin would add more build
config than the ~60 lines it replaces. Cache-first everything: no server, no
API, no data in flight — once cached the app is permanently offline-capable,
which is correct for a drawing tool.

**Persistence drops `points` before writing.** Only the rendered `d` string is
kept; points are ~20× the size and only needed for live smoothing, which by
definition isn't happening for a committed stroke.

**Autosave flushes on `pagehide`, not `beforeunload`.** iOS never fires
beforeunload when an app is swiped away. localStorage over IndexedDB for the
same reason — synchronous writes survive abrupt termination.

**The install banner waits until something is drawn.** Asking a stranger to
install an app they haven't tried is how banners get ignored. iOS gets
instructions rather than a button, because iOS has no install API at all.

**Print goes through a hidden iframe.** `window.print()` on the live page would
carry the toolbar, stats panel and a viewport-height canvas onto the paper. The
iframe gets a purpose-built A4 document containing only the drawing.

**The print SVG nests rather than transform-scales.** A `transform: scale()`
scales stroke-width with geometry, so thin lines print as hairlines that some
printers drop entirely. Nesting an inner `<svg>` with its own viewBox keeps
stroke widths in page units.

**`print-color-adjust: exact` is load-bearing.** Browsers strip background fills
to save ink by default, which would erase the paper colour and the grid — the
entire point of printing a notebook.

**Sound and animation fire from one `celebrate()` call.** 410ms of chime timed
against the same duration of sweep, with the stamp landing on the final pip.
Split them and it reads as two unrelated events instead of one.

**Pencil is an SVG filter, not a canvas renderer.** feTurbulence displacing the
stroke edge. WebGL would look better and would also destroy the vector export,
which is the entire point of the gift. ~30 lines instead of a renderer, and it
degrades to a clean line where filters are slow.

**The pencil filter is NOT exported.** Figma and most SVG consumers rasterize
filters on import — a filtered export would arrive as a bitmap. The export
carries `stroke-opacity` only, so the graphite feel survives and the geometry
stays editable.

**The filter stays in `<defs>` even when pencil is off.** Adding and removing
it forces Safari to re-rasterize every stroke on toggle.

**Pencil is per-stroke, not global.** Strokes record how they were drawn, so
switching tools doesn't retroactively rewrite the page — same as a real desk.

**Triple-tap is deliberately strict.** Three taps, 600ms, within 30px, none of
them a drag. This shares a surface with drawing and three dots in one spot is a
legitimate thing to draw. A false negative costs one repeated gesture; a false
positive interrupts someone mid-drawing. `drawing.cancel()` exists so a
completed gesture doesn't also commit three dots.

**Ruler snapping happens in `Canvas.at()`, at the coordinate source.** Every
consumer — drawing, gestures, instruments — then sees the same point.

**The ruler projects onto the infinite line, not the segment.** A ruler you can
only draw along the middle of is worse than a real one.

**Angle snapping only engages within 4° of a 15° detent.** Constant snapping
makes freehand impossible.

**Instruments render in a sibling `<svg>`, not the paper.** A ruler that ends
up in someone's Figma file is a bug.

**Strokes and redo are one state object, not two.** `useDrawing` keeps
`{ strokes, redo }` in a single `useState`. With two hooks, an undo/redo
transition is split across two updaters, and React runs updaters in
hook-declaration order — so `redo` read a value the other updater had not
written yet and silently restored nothing. One updater makes every transition
atomic.

**The service worker registers against `document.baseURI`, not
`import.meta.url`.** The bundle lives in `assets/` but `sw.js` sits beside
`index.html`; resolving against the module URL asks for `assets/sw.js`, gets
the SPA fallback, and fails with an MIME-type error. `baseURI` is also what
keeps registration correct from a subdirectory.

**`projectToLine` rounds its result.** The projection is float-noisy
(`199.99999999999997`), and a snapped point is meant to be exact — it feeds
drawing, gestures and the export alike.

**The toolbar is two explicit rows, not `flex-wrap`.** Wrapping put sixteen
controls on three rows and took a quarter of the page. The paper wins every
argument with the chrome.

**Tests run in a 390×700 window.** jsdom defaults to 1024×768, where the
instruments sit under coordinates a phone would never put them — a triple-tap
in the middle of the page landed on the ruler instead. The whole product is
touch, so the test viewport is a phone.

**`getCoalescedEvents` in the move handler.** Replays samples the browser
batched between frames. On 120Hz displays it's the difference between a smooth
curve and a faceted one.

## Testing

```bash
npm test          # once
npm run test:watch
```

207 tests. Keep it that way — logic lives in `lib/` and `hooks/` precisely so it
can be tested without rendering.

Note: tests dispatch `pointerdown`, not `click`, because that's what the
components listen for. `src/test/setup.js` shims `PointerEvent`, `getBBox`, and
pointer capture, none of which jsdom implements.

## Verifying a change

A desktop browser tells you almost nothing here — the entire product is touch
feel. `npm run dev` binds `0.0.0.0`; open it on an actual phone on the same
wifi. Draw a fast diagonal, draw a slow curve, draw off the edge of the screen,
tap once for a dot. If any of those feel off, the change is wrong.

## Language

UI strings are Armenian. Code, comments and commits are English.

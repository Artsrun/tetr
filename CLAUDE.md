# Տետր — AI working notes

Digital Soviet grid notebook. Draw with a finger, export real SVG. Mobile-first,
offline, no accounts, no cloud, no tracking.

Two editions out of one bundle: «Տետր» by default, «Երկրաչափ» on `?v=2`
(`src/lib/edition.js`). They share every line of drawing code.

## The one rule

**This is a gift, not a product.** Every decision optimises for the moment
someone opens it on a phone and draws a line. If a change makes that line feel
worse, it's the wrong change — no matter what else it improves.

## Stack

React 19 · Vite 6 · Vitest 3 · plain CSS. Zero runtime dependencies beyond React.

Adding a dependency needs a real argument. The whole app gzips to ~87KB — most
of it React, and ~6KB of it the Armenian lesson copy, which is two bytes a
character. It should stay around there.

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
  lib/instruments   calliper math (the triple-tap easter egg)
  lib/solids.js     cabinet projection — the five school solids
  lib/hit.js        path flattening + hit-testing, so the rubber can lift ink
  lib/gestures.js   triple-tap tracker — strict on purpose, see below
  lib/spread.js     which page sits on which side when the notebook lies flat
  lib/lessons.js    school angle/measure/algebra facts, and the maths behind them
  lib/edition.js    the two editions and the ?v=2 door between them
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
them a drag. Three more put the calliper away. This shares a surface with
drawing, and three dots in one spot is a legitimate thing to draw. A false negative costs one repeated gesture; a false
positive interrupts someone mid-drawing. `drawing.cancel()` exists so a
completed gesture doesn't also commit three dots.

**There is no ruler, and `Canvas.at()` snaps nothing.** It went on purpose: the
shape tools already lay a straight line on the grid, and an instrument that
silently bends a freehand stroke is the app fighting the finger. `at()` is now
one coordinate source and nothing more — drawing, gestures and the calliper all
read the same point. The calliper stayed because it only reads the page back to
you; it never moves a stroke.

**Angle snapping only engages within 4° of a 15° detent.** Constant snapping
makes freehand impossible.

**Instruments render in a sibling `<svg>`, not the paper.** A calliper that ends
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

**Solids are ink, like every other shape.** Cube, cylinder, cone, sphere and
pyramid commit as one stroke `d` with several subpaths, so undo, export, print
and persistence never learn that anything is 3D. Nothing in the app models a
solid; `solids.js` only knows how to draw one.

**Cabinet projection, not isometric.** Depth runs up-right at 45° at half
scale, snapped to the grid, so the back face lands on intersections instead of
floating between them — the projection every school textbook draws by hand, and
the only one the notebook can hold.

**Hidden edges are not drawn at all.** A dashed back edge would need a second
stroke style, and a stroke carries one dash pattern; the cube drops the corner
behind the solid and the pyramid drops the back-left one, which is what a
textbook figure looks like anyway.

**A solid's `points` walk its own outline.** The rubber hit-tests `points` as
one polyline (`hit.js`), so the vertices are listed in the order the pen visits
them and the curved solids sample their ellipses. List them any other way and
the rubber starts catching diagonals that were never drawn.

**`flattenPath` honours the arc sweep flag.** Without it the near half of a
cylinder's base flattens as the far half, and the rubber hunts for ink 30px
away from where it is.

**The rubber lifts ink; it never writes.** `Canvas` calls `removeIds` straight
from the move handler, and passes `extend` so one pass is one undo. Undo puts a
batch back newest-first, because each index was taken against the array as it
stood at that moment.

**The tool sheet is two shelves of icons, not eleven named rows.** Names beside
eleven tools leave a 390px phone with no paper. The tab shows the armed tool and
the hint line spells it out in words the moment one is picked.

**The toolbar is two explicit rows, not `flex-wrap`.** Wrapping put sixteen
controls on three rows and took a quarter of the page. The paper wins every
argument with the chrome.

**Tests run in a 390×700 window.** jsdom defaults to 1024×768, where the
instruments sit under coordinates a phone would never put them — a triple-tap
in the middle of the page landed on the instrument instead. The whole product is
touch, so the test viewport is a phone.

**The tool sheet is `position: absolute`, and its list needs an explicit
`[hidden]` rule.** Every other child of `.app` is positioned, so an in-flow
`<aside>` paints beneath the canvas and takes no pointer events — the sheet
shipped that way once and was invisible. And `.sheet__list { display: flex }`
outranks the UA's `[hidden] { display: none }`, so the panel never closes
unless the stylesheet opts back out.

**Picking a tool closes the sheet.** The panel sits over the paper; the next
thing anyone does after choosing a shape is draw, and a picker you have to
dismiss by hand eats that first stroke.

**The rebrand is a query param, not a branch.** `?v=2` opens «Երկրաչափ»;
everything else opens «Տետր». One bundle, one deploy, one table
(`lib/edition.js`) holding every difference — and a stranger with a link can
see either. An edition changes the name, the mark, the title, the chrome
palette and what the app opens on. It does **not** change `--paper`, `--grid`
or any stroke value: those literals are written into every exported file, so a
rebrand that moved them would retroactively change work people already made. A
rebrand is a cover, not a line.

**Each edition gets its own wizard key.** A new cover deserves its own first
run; sharing the key would mean the v2 tour never shows to anyone who already
used v1.

**Zoom goes below 1, and at ≤0.8 the notebook lies flat.** `MIN_ZOOM` is 0.5
because 390×2 + a gutter is 804, and a 390px phone at 50% shows 780 of it —
two sheets, which is what opening a notebook looks like. `clampView` centres
the world when the window is wider than it, instead of pinning it to the left
edge with dead space beside it.

**Strokes stay page-local; a spread only moves a sheet's origin.** `Canvas.at()`
subtracts the active sheet's origin before any point leaves the component, so
`useDrawing`, the gestures and the calliper never learn that a spread exists —
and nothing on disk changes when you zoom out.

**The facing sheet is a page, not more canvas.** Touching it turns to it; the
ghost sheet on the right of the last page adds one. Drawing across the binding
would have to either split a stroke over two pages or silently pick one, and
both are the app deciding something the hand did not.

**The stroke has a voice, and it is generated too.** `startStroke()` opens one
looping noise source per stroke, band-passed (broad and low for pencil,
narrower for pen) with gain and brightness following px/ms — a slow curve
whispers, a fast diagonal scratches. It is not a cue: cues are events, this is
a surface. Still no audio file, and there must never be one. `startStroke`
always returns a voice object, so muted, no AudioContext and a thrown
constructor all sound the same to the caller and nothing needs a guard.

**Every exit from a stroke silences it.** commit, commitPath and cancel all
call `hush()`. A voice left running after the finger lifts is a stuck noise
loop, which is the single worst bug this feature could have.

**The lessons panel reads from the same functions the calliper does.**
`lessons.js` holds both the copy and the maths, so the name under the
instrument («սուր անկյուն») and the sentence in the panel cannot disagree. The
calliper draws the arc it is quoting — the explanation sits over the
measurement rather than beside it.

**One cell is 5mm.** That is what Soviet grid paper measures, so every length
can be said in cells, millimetres and centimetres without inventing a scale
nobody can check with a ruler.

**`getCoalescedEvents` in the move handler.** Replays samples the browser
batched between frames. On 120Hz displays it's the difference between a smooth
curve and a faceted one.

## Testing

```bash
npm test          # once
npm run test:watch
```

407 tests. Keep it that way — logic lives in `lib/` and `hooks/` precisely so it
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

# Տետր 🦊

A digital Soviet school notebook. Draw on the grid with a finger, export real
vector SVG. Opens in Figma.

No account. No cloud. No analytics. No ads. Just a page.

```bash
npm install
npm run dev      # then open the printed network URL on your phone
```

## Why it exists

A friend of ten years who doesn't like being asked questions. Words weren't
landing, so: a blank page instead. He's a designer — he'll know what to do with
it.

## Using it

Open on a phone → Share → **Add to Home Screen**. It launches without browser
chrome and works offline after the first load.

| | |
|---|---|
| Draw | one finger |
| Colour | tap a swatch — the ring shows how much of the drawing uses it |
| Width | tap a dot, rendered at the actual stroke size |
| Pencil / pen | ✎ ✒ — graphite grain or a clean line, per stroke |
| Undo / Redo | ↩ ↪ · ⌘Z / ⇧⌘Z on desktop |
| Clear | ✕ twice — and still recoverable via redo |
| Print | ⎙ — A4 with grid · **long-press** for no grid · ⌘P |
| Export | ↓ — timestamped SVG · ⌘S on desktop |
| Sound | 🔈 in the stats bar — every action has its own cue |
| Stats | tap the 📈 line to expand |

## Stack

React 19, Vite 6, Vitest 3, plain CSS. Zero runtime deps beyond React.
~71KB gzipped.

**Installable PWA.** Add to Home Screen and it launches without browser chrome,
works fully offline, and restores your drawing if the OS kills it.

**No audio files.** All seven sound cues are synthesized at runtime from
oscillators and filtered noise — nothing licensed, nothing fetched, zero bytes
shipped. Works on a plane.

```bash
npm test          # 195 tests
npm run build
```

## Deploying

Static output — any host works.

```bash
npm run build     # → dist/
```

`base: './'` in `vite.config.js` means it runs from a subdirectory too
(GitHub Pages, a folder on a shared host) without changes.

## Notes

`CLAUDE.md` documents the decisions that look wrong but aren't — the live
stroke bypassing React, the export serializing from state rather than cloning
the DOM, the two-step clear. Read it before changing the drawing path.

## 🦊

Triple-tap the paper.

---

*Գայլը կոդ է գրում, աղվեսը՝ գծում* 🐺🦊

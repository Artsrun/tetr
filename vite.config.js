import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // base: './' — relative asset paths. Required if this is ever served from a
  // subdirectory (GitHub Pages, /tetr/ on a shared host) instead of a root domain.
  base: './',

  server: {
    port: 5173,
    // host: true — bind 0.0.0.0 so the phone on the same wifi can open it.
    // The whole point of this app is touch input; testing it in a desktop
    // browser tells you almost nothing about how the drawing actually feels.
    host: true,
  },

  build: {
    // No code splitting worth doing here — the app is a few KB. A single
    // bundle means one request, which matters more on mobile than tree depth.
    target: 'es2022',
    cssMinify: 'lightningcss',

    // rollupOptions: {
    //   output: { manualChunks: undefined },
    // },
  },

  test: {
    // jsdom, not happy-dom: we lean on PointerEvent and getBoundingClientRect,
    // and jsdom's implementations are closer to the real thing.
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})

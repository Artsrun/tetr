import { useCallback, useEffect, useState } from 'react'

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent)

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true)

/**
 * Service worker, install prompt, offline state.
 *
 * The service worker is hand-written (CLAUDE.md) — a PWA plugin would add more
 * build config than the ~60 lines it replaces. Cache-first everything: no
 * server, no API, no data in flight.
 */
export function usePWA() {
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone)
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (import.meta.env?.DEV) return
    // Resolve against document.baseURI, not import.meta.url: the bundle lives
    // in assets/ but sw.js sits beside index.html, and baseURI is also what
    // makes this work unchanged from a subdirectory (GitHub Pages /tetr/).
    const base = document.baseURI
    navigator.serviceWorker
      .register(new URL('sw.js', base), { scope: new URL('./', base) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPrompt(null)
    }
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const install = useCallback(async () => {
    if (!prompt) return false
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    setPrompt(null)
    return outcome === 'accepted'
  }, [prompt])

  return {
    // iOS has no install API at all, so it gets instructions rather than a button.
    canInstall: !!prompt,
    needsInstructions: isIOS() && !installed,
    installed,
    offline,
    install,
  }
}

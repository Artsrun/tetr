// Hand-written on purpose (CLAUDE.md): a PWA plugin would add more build config
// than the ~60 lines it replaces.
//
// Cache-first everything. There is no server, no API and no data in flight, so
// once cached the app is permanently offline-capable — which is exactly right
// for a drawing tool. The drawing itself lives in localStorage, never here.

const CACHE = 'tetr-v4'
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-maskable.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
          return response
        })
        .catch(() =>
          request.mode === 'navigate' ? caches.match('./index.html') : Response.error(),
        )
    }),
  )
})

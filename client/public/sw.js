// enclave service worker — minimal app shell caching.
// Strategy:
//   - Pre-cache the app shell (index, manifest, icons) on install.
//   - Network-first for navigations (HTML) so updates roll out fast; falls back
//     to cache when offline.
//   - Cache-first for static assets (JS, CSS, fonts, images) keyed by URL.
//   - Never cache /api or /socket.io — those are real-time / stateful.

const CACHE_VERSION = 'enclave-v2'
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

function isApiOrSocket(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/socket.io')
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (isApiOrSocket(url)) return // let the network handle real traffic

  // Navigations (HTML): network-first, fall back to cached shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res
        const copy = res.clone()
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {})
        return res
      }).catch(() => cached)
    })
  )
})

// Optional: allow the page to ask for a skipWaiting on update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

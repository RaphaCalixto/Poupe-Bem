const CACHE_NAME = 'poupe-bem-v2'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192.png',
  '/pwa-512.png',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)
  const sameOrigin = requestUrl.origin === self.location.origin
  const hasQuery = requestUrl.search.length > 0
  const isNavigation = event.request.mode === 'navigate'

  // Nunca cacheia fluxos com query string (ex.: callbacks de auth do Clerk)
  if (hasQuery) {
    event.respondWith(fetch(event.request))
    return
  }

  // Navegação: network-first para evitar retorno de tela antiga após login
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // Só faz cache de assets do próprio domínio
  if (!sameOrigin) {
    return
  }

  const canCacheDestination = ['script', 'style', 'image', 'font', 'manifest'].includes(
    event.request.destination,
  )

  if (!canCacheDestination) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(event.request).then((response) => {
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
    }),
  )
})

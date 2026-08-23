// Service Worker for Vijaya Colony Ganesha Diaries with Auto-Cache Invalidation
const CACHE_VERSION = 'ganesha-diaries-v' + Date.now();

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for old clients to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Delete all old caches to force fresh assets
          if (key !== CACHE_VERSION) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-Only for dynamic APIs, WebSockets, HTML navigation and Manifest
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.endsWith('manifest.json') ||
    url.pathname.endsWith('index.html') ||
    url.pathname === '/' ||
    url.search.includes('v=')
  ) {
    return event.respondWith(fetch(event.request));
  }

  // Network-First with Cache Fallback for static assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

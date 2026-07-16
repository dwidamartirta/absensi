const CACHE_NAME = 'ddt-absen-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
  '/img/logo dwi damar tirta.webp'
];

// Install Event - Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle Caching Strategy (Stale-While-Revalidate & Network-Only for APIs)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. API Requests & WebSockets: Network Only
  if (requestUrl.pathname.startsWith('/api/') || requestUrl.host.includes('ddtsystem.test')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Leaflet Tiles (OpenStreetMap): Cache First to save data & work offline
  if (requestUrl.host.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open('ddt-map-tiles').then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 3. SPA Routing Fallback (For refresh on nested client routes like /absensi, /profil, etc.)
  // If requesting a document page, return the cached index.html so the SPA router can mount properly offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 4. General Static Assets: Stale-While-Revalidate
  // Serve from cache instantly, but update in the background for next loads.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => { /* Ignore offline fetch failures */ });

        return cachedResponse;
      }

      // If not in cache, fetch from network and add to cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Return index.html if asset is a page chunk, or let browser handle media failures
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

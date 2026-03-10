// MobiaL eSIM Service Worker
// Version 2.0.0

const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `mobial-static-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `mobial-images-${CACHE_VERSION}`;
const API_CACHE_NAME = `mobial-api-${CACHE_VERSION}`;

// App shell - static assets to cache on install
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  '/offline.html',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[SW] App shell cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache app shell:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2...');

  const currentCaches = [STATIC_CACHE_NAME, IMAGE_CACHE_NAME, API_CACHE_NAME];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => !currentCaches.includes(cacheName))
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - route requests to appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE_NAME));
  } else if (isImageRequest(request, url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else {
    event.respondWith(networkFirst(request, STATIC_CACHE_NAME));
  }
});

// --- Request classification ---

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || url.hostname.includes('api.');
}

function isImageRequest(request, url) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.avif'];
  if (imageExtensions.some((ext) => url.pathname.endsWith(ext))) return true;
  const accept = request.headers.get('accept');
  return accept && accept.includes('image');
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

// --- Caching strategies ---

// Cache-first: try cache, fall back to network, update cache
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Stale-while-revalidate: update in background
    fetchAndCache(request, cache);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // For images, return a placeholder SVG
    if (cacheName === IMAGE_CACHE_NAME) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#1a1a2e" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="14">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    return createOfflineResponse();
  }
}

// Network-first: try network, fall back to cache
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    // For navigation requests, show offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }

    // For API requests, return JSON error
    if (cacheName === API_CACHE_NAME) {
      return new Response(
        JSON.stringify({ error: 'offline', message: 'You are currently offline' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return createOfflineResponse();
  }
}

// Background fetch and cache update
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - cached version already served
  }
}

function createOfflineResponse() {
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

// --- Push notifications ---

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'MobiaL',
    body: 'You have a new notification!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    url: '/',
    tag: 'mobial-general',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    tag: data.tag,
    renotify: true,
    data: {
      url: data.url,
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed');
});

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncCart() {
  try {
    console.log('[SW] Syncing cart data...');
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
  }
}

console.log('[SW] Service worker v2 loaded');

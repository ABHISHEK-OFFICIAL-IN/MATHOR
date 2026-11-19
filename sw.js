/* =====================================================================
   Maths Notebook — Service Worker
   Bump VERSION every time you ship new HTML/CSS/JS.
   ===================================================================== */
const VERSION    = 'v1.0.0';
const CACHE_NAME = `maths-notebook-${VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './logo.jpg'
];

/* ---------- INSTALL ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // add individually so one 404 doesn't kill the whole install
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (err) {
        console.warn('[SW] precache skipped:', url, '→', err.message);
      }
    }));
    self.skipWaiting();
  })());
});

/* ---------- ACTIVATE ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ---------- FETCH ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* 1) Navigation → network-first, fallback to cache, then offline.html */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(req)) ||
          (await cache.match('./index.html')) ||
          (await cache.match('./offline.html')) ||
          new Response('<h1>Offline</h1>', {
            headers: { 'Content-Type': 'text/html' }
          })
        );
      }
    })());
    return;
  }

  /* 2) Cross-origin (Google Fonts etc.) → stale-while-revalidate */
  if (url.origin !== self.location.origin) {
    event.respondWith((async () => {
      const cache  = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);

      const network = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      }).catch(() => null);

      return cached || (await network) ||
        new Response('', { status: 504, statusText: 'Offline' });
    })());
    return;
  }

  /* 3) Same-origin static assets → cache-first with background refresh */
  event.respondWith((async () => {
    const cache  = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    if (cached) {
      // refresh in background, but serve cached immediately
      fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      }).catch(() => {});
      return cached;
    }

    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});

/* ---------- MESSAGES ---------- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
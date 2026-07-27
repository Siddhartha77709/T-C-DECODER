const CACHE_NAME = 'tanc-decoder-v6';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

const ASSET_EXTENSIONS = /\.(css|js|mjs|map|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|eot|mp4|webm|mp3|wav|json|pdf|txt|zip)$/i;

function hasAssetExtension(request) {
  try {
    const url = new URL(request.url);
    return ASSET_EXTENSIONS.test(url.pathname);
  } catch {
    return false;
  }
}

function isHtmlMime(response) {
  try {
    const ct = (response && response.headers && response.headers.get('content-type')) || '';
    return /text\/html/i.test(ct);
  } catch {
    return false;
  }
}

function rejectHtmlAsAsset(cachedResponse, request) {
  if (!cachedResponse) return false;
  if (!hasAssetExtension(request)) return false;
  if (isHtmlMime(cachedResponse)) {
    console.warn('[SW v6] Rejecting stale HTML cached response for asset request:', request.url);
    return true;
  }
  return false;
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      console.log('[SW v6] Installed & precache populated. Forcing activation...');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('[SW v6] Purging stale cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => {
      console.log('[SW v6] Activated — claiming all open clients.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', (e) => {
  try {
    const msg = e?.data;
    if (msg && typeof msg === 'object' && msg.type === 'SKIP_WAITING_PLEASE') {
      console.log('[SW v6] Received SKIP_WAITING_PLEASE from client — forcing skipWaiting.');
      self.skipWaiting();
    }
  } catch {
    /* no-op */
  }
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // ── 1) NAVIGATIONS (HTML documents): NETWORK-FIRST, fallback to cached HTML only
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request, { ignoreVary: true }).then((cachedResponse) => {
            if (cachedResponse && !rejectHtmlAsAsset(cachedResponse, request)) {
              return cachedResponse;
            }
            return caches.match('/index.html').catch(() => Response.error());
          });
        })
    );
    return;
  }

  // ── 2) HASHED ASSETS in /assets/ (CSS / JS / hashed bundles): CACHE-FIRST, NEVER serve HTML.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(request, { ignoreVary: true }).then((cachedResponse) => {
        if (cachedResponse && !rejectHtmlAsAsset(cachedResponse, request)) {
          return cachedResponse;
        }
        // Cache miss or rejected HTML-as-asset fallback → go to network
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && !isHtmlMime(networkResponse)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return networkResponse;
          }
          // Cloudflare returned HTML SPA fallback for a missing asset → browser MUST fail this,
          // never allow text/html into an <link rel=stylesheet> / <script type=module> slot.
          console.error('[SW v6] Asset request rejected or non-200 — refusing to serve HTML. url=', request.url);
          return Response.error();
        }).catch((err) => {
          console.warn('[SW v6] Asset network failed, no valid cache fallback. url=', request.url, err);
          return Response.error();
        });
      })
    );
    return;
  }

  // ── 3) EVERYTHING ELSE (favicon, manifest, fonts, static images): STALE-WHILE-REVALIDATE.
  //    — But STILL reject HTML if the request bears an asset extension!
  e.respondWith(
    caches.match(request, { ignoreVary: true }).then((cachedResponse) => {
      const hasAssetExt = hasAssetExtension(request);
      const cacheUsable = cachedResponse && !rejectHtmlAsAsset(cachedResponse, request);

      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const isHtml = isHtmlMime(networkResponse);
            if (hasAssetExt && isHtml) {
              console.error('[SW v6] Asset-extension request received HTML — refusing to cache. url=', request.url);
              return Response.error();
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return networkResponse;
          }
          return networkResponse;
        })
        .catch((err) => {
          // Offline. Only fall back to cache if we confirmed it's not a mismatched HTML mime.
          if (cacheUsable) {
            return cachedResponse;
          }
          console.warn('[SW v6] Network + cache both fail. url=', request.url, err);
          return Response.error();
        });

      return cacheUsable ? cachedResponse : fetchPromise;
    })
  );
});

const CACHE = 'tokyo-concierge-v8';
const BUNDLE_ASSETS = [];
const SPOT_PHOTOS = [];
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  ...BUNDLE_ASSETS
];
const MAPS = Array.from({ length: 6 }, (_, i) => `assets/route-${i + 1}.png`);
const DOC_ASSET = [encodeURI('assets/도쿄여행 일정.docx')];

// 개별 항목을 안전하게 캐시에 저장하는 헬퍼
async function cacheUrlsSafely(cache, urls) {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      await cache.put(url, response);
    })
  );
  return results;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cacheUrlsSafely(cache, CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => (k.startsWith('tokyo-companion-') || k.startsWith('tokyo-concierge-')) && k !== CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const network = () => fetch(request).then(response => {
    if (response.ok && response.type === 'basic' && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  });

  const fallback = async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return (await caches.match('./')) || (await caches.match('index.html')) || Response.error();
    }
    return Response.error();
  };

  event.respondWith(
    url.pathname.includes('/assets/') || url.pathname.includes('/bundle/')
      ? caches.match(request).then(cached => cached || network()).catch(fallback)
      : network().catch(fallback)
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'CACHE_TRIP') {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CACHE);
        const essentialResults = await cacheUrlsSafely(cache, [...CORE, ...MAPS]);
        const essentialOk = essentialResults.every(r => r.status === 'fulfilled');
        // 현장 실물사진(24장)과 원본 문서는 보조/병렬 항목으로 함께 오프라인 캐시에 저장
        await cacheUrlsSafely(cache, [...SPOT_PHOTOS, ...DOC_ASSET]);
        event.ports[0]?.postMessage({ ok: essentialOk });
      } catch {
        event.ports[0]?.postMessage({ ok: false });
      }
    })());
  }
});

const CACHE = 'tokyo-concierge-v9';
const BUNDLE_ASSETS = [];
const SPOT_PHOTOS = [];
const AUDIO_CLIPS = [];
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

/**
 * Safari/PWA <audio> 요소의 Range 요청에 대해 캐시된 전체 MP3 응답에서 206 Partial Content 반환
 */
async function createRangeResponse(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) return cachedResponse;

  try {
    const buffer = await cachedResponse.arrayBuffer();
    const total = buffer.byteLength;
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (!match) return cachedResponse;

    let start = match[1] ? Number(match[1]) : 0;
    let end = match[2] ? Number(match[2]) : total - 1;
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end) || end >= total) end = total - 1;
    if (start > end || start >= total) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${total}` },
      });
    }

    const sliced = buffer.slice(start, end + 1);
    const headers = new Headers(cachedResponse.headers);
    headers.set('Content-Length', String(sliced.byteLength));
    headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
    headers.set('Accept-Ranges', 'bytes');

    return new Response(sliced, {
      status: 206,
      statusText: 'Partial Content',
      headers,
    });
  } catch {
    return cachedResponse;
  }
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
    // Cache API는 200 전체 응답만 저장 (206 Partial Content 저장 불가)
    if (response.status === 200 && response.type === 'basic' && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  });

  const fallback = async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return request.headers.has('range') ? createRangeResponse(request, cached) : cached;
    if (request.mode === 'navigate') {
      return (await caches.match('./')) || (await caches.match('index.html')) || Response.error();
    }
    return Response.error();
  };

  if (request.headers.has('range')) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true })
        .then(cached => (cached ? createRangeResponse(request, cached) : fetch(request)))
        .catch(() => fetch(request))
    );
    return;
  }

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
        // 현장 실물사진, 일본어 음성 MP3, 원본 문서는 보조/병렬 항목으로 함께 오프라인 캐시에 저장
        await cacheUrlsSafely(cache, [...SPOT_PHOTOS, ...AUDIO_CLIPS, ...DOC_ASSET]);
        event.ports[0]?.postMessage({ ok: essentialOk });
      } catch {
        event.ports[0]?.postMessage({ ok: false });
      }
    })());
  }
});

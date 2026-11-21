const CACHE = 'tokyo-concierge-v13';
const BUNDLE_ASSETS = ["bundle/index-CuwVdAyI.js","bundle/index-DQkRPAj8.css","bundle/vendor-charts-CaYyejNI.js","bundle/vendor-maps-CcVeBEmQ.js","bundle/vendor-motion-DxbpWIlp.js","bundle/vendor-react-r0wE4FL7.js","bundle/vendor-utils-DTmklHex.js"];
const SPOT_PHOTOS = ["assets/spots/01-narita-t3.jpg","assets/spots/02-limousine-counter.jpg","assets/spots/03-limousine-bus.jpg","assets/spots/04-tcat-arrival.jpg","assets/spots/05-hotel-entrance.jpg","assets/spots/05b-hotel-exterior.jpg","assets/spots/05c-hotel-lobby.jpg","assets/spots/06-pasmo-machine.jpg","assets/spots/07-suitengumae-station.jpg","assets/spots/08-oshiage-station.jpg","assets/spots/09-solamachi-shops.jpg","assets/spots/10-skytree-4f-entrance.jpg","assets/spots/11-skytree-night-view.jpg","assets/spots/12-ningyocho-station.jpg","assets/spots/13-asakusa-kaminarimon.jpg","assets/spots/14-azumabashi-skytree.jpg","assets/spots/15-akihabara-radio.jpg","assets/spots/16-akihabara-hibiya.jpg","assets/spots/17-ginza-wako-night.jpg","assets/spots/18-hatchobori-keiyo.jpg","assets/spots/19-maihama-resortline.jpg","assets/spots/20-disneysea-station.jpg","assets/spots/21-fantasy-springs.jpg","assets/spots/22-disneysea-harbor-night.jpg","assets/spots/23-tcat-3f-departure.jpg","assets/spots/24-narita-departure.jpg","assets/spots/25-sumida-aquarium.jpg","assets/spots/26-planetarium-tenku.jpg","assets/spots/27-mizumachi-xmas.jpg"];
const RESTAURANT_PHOTOS = ["assets/restaurants/r-1-1-menu.jpg","assets/restaurants/r-1-1-shop.jpg","assets/restaurants/r-1-2-menu.jpg","assets/restaurants/r-1-2-shop.jpg","assets/restaurants/r-1-3-menu.jpg","assets/restaurants/r-1-3-shop.jpg","assets/restaurants/r-2-1-menu.jpg","assets/restaurants/r-2-1-shop.jpg","assets/restaurants/r-2-2-menu.jpg","assets/restaurants/r-2-2-shop.jpg","assets/restaurants/r-2-3-menu.jpg","assets/restaurants/r-2-3-shop.jpg","assets/restaurants/r-3-1-menu.jpg","assets/restaurants/r-3-1-shop.jpg","assets/restaurants/r-3-2-menu.jpg","assets/restaurants/r-3-2-shop.jpg","assets/restaurants/r-3-3-menu.jpg","assets/restaurants/r-3-3-shop.jpg","assets/restaurants/r-4-1-menu.jpg","assets/restaurants/r-4-1-shop.jpg","assets/restaurants/r-4-2-menu.jpg","assets/restaurants/r-4-2-shop.jpg","assets/restaurants/r-4-3-menu.jpg","assets/restaurants/r-4-3-shop.jpg","assets/restaurants/r-5-1-menu.jpg","assets/restaurants/r-5-1-shop.jpg","assets/restaurants/r-5-2-menu.jpg","assets/restaurants/r-5-2-shop.jpg","assets/restaurants/r-5-3-menu.jpg","assets/restaurants/r-5-3-shop.jpg"];
const AUDIO_CLIPS = ["assets/audio/item-d1-1.mp3","assets/audio/item-d1-2.mp3","assets/audio/item-d1-3.mp3","assets/audio/item-d1-4.mp3","assets/audio/item-d1-5.mp3","assets/audio/item-d1-6.mp3","assets/audio/item-d1-sky.mp3","assets/audio/item-d2-1.mp3","assets/audio/item-d2-2.mp3","assets/audio/item-d2-3.mp3","assets/audio/item-d2-4.mp3","assets/audio/item-d2-5.mp3","assets/audio/item-d3-1.mp3","assets/audio/item-d3-2.mp3","assets/audio/item-d3-3.mp3","assets/audio/item-d3-4.mp3","assets/audio/item-d4-1.mp3","assets/audio/item-d4-2.mp3","assets/audio/item-d4-3.mp3","assets/audio/phrase-p1.mp3","assets/audio/phrase-p10.mp3","assets/audio/phrase-p11.mp3","assets/audio/phrase-p12.mp3","assets/audio/phrase-p13.mp3","assets/audio/phrase-p14.mp3","assets/audio/phrase-p15.mp3","assets/audio/phrase-p16.mp3","assets/audio/phrase-p2.mp3","assets/audio/phrase-p3.mp3","assets/audio/phrase-p4.mp3","assets/audio/phrase-p5.mp3","assets/audio/phrase-p6.mp3","assets/audio/phrase-p7.mp3","assets/audio/phrase-p8.mp3","assets/audio/phrase-p9.mp3","assets/audio/spot-spot-1-1.mp3","assets/audio/spot-spot-1-10.mp3","assets/audio/spot-spot-1-11.mp3","assets/audio/spot-spot-1-2.mp3","assets/audio/spot-spot-1-3.mp3","assets/audio/spot-spot-1-4.mp3","assets/audio/spot-spot-1-5.mp3","assets/audio/spot-spot-1-6.mp3","assets/audio/spot-spot-1-7.mp3","assets/audio/spot-spot-1-8.mp3","assets/audio/spot-spot-1-9.mp3","assets/audio/spot-spot-2-1.mp3","assets/audio/spot-spot-2-2.mp3","assets/audio/spot-spot-2-3.mp3","assets/audio/spot-spot-2-4.mp3","assets/audio/spot-spot-2-5.mp3","assets/audio/spot-spot-2-6.mp3","assets/audio/spot-spot-3-1.mp3","assets/audio/spot-spot-3-2.mp3","assets/audio/spot-spot-3-3.mp3","assets/audio/spot-spot-3-4.mp3","assets/audio/spot-spot-3-5.mp3","assets/audio/spot-spot-4-1.mp3","assets/audio/spot-spot-4-2.mp3"];
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
        // 현장 실물사진, 맛집 식당·메뉴사진, 일본어 음성 MP3, 원본 문서는 보조/병렬 항목으로 함께 오프라인 캐시에 저장
        await cacheUrlsSafely(cache, [...SPOT_PHOTOS, ...RESTAURANT_PHOTOS, ...AUDIO_CLIPS, ...DOC_ASSET]);
        event.ports[0]?.postMessage({ ok: essentialOk });
      } catch {
        event.ports[0]?.postMessage({ ok: false });
      }
    })());
  }
});

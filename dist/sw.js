const CACHE='tokyo-companion-v2';
const CORE=['./','index.html','styles.css','app.js','data.js','manifest.webmanifest','assets/icon.svg','assets/icon-192.png','assets/icon-512.png'];
const MAPS=Array.from({length:6},(_,i)=>`assets/route-${i+1}.png`);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tokyo-companion-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  const network=()=>fetch(request).then(response=>{
    if(response.ok&&response.type==='basic'&&!response.redirected){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
    return response;
  });
  const fallback=()=>caches.match(request).then(cached=>cached||(request.mode==='navigate'?caches.match('./'):Response.error()));
  event.respondWith(url.pathname.includes('/assets/')?caches.match(request).then(cached=>cached||network()).catch(fallback):network().catch(fallback));
});
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_TRIP'){event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...CORE,...MAPS])).then(()=>event.ports[0]?.postMessage({ok:true})).catch(()=>event.ports[0]?.postMessage({ok:false})));}});

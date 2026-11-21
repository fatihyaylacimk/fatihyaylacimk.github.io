const CACHE='pear-story-v2';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./orchard.webp','./grafting.webp','./muse.webp','./pear-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/yaylaci-kuyumculuk/')) return;
  if (url.pathname === '/parfum-galerisi' || url.pathname.startsWith('/parfum-galerisi/')) return;
  if (url.pathname === '/why-zero' || url.pathname.startsWith('/why-zero/')) return;

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, clone));
    }
    return response;
  })));
});

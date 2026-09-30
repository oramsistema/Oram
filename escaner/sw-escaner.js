const CACHE_NAME = 'oram-escaner-v1';
const URLS_TO_CACHE = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Solo intercepta lo que pertenece a esta misma página (para poder abrirla
// sin internet); todo lo demás (Supabase, CDNs) sigue de largo a la red.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if(url.origin === self.location.origin && event.request.method === 'GET'){
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if(networkResponse && networkResponse.ok){
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

/* ==========================================================================
   StudyHub — Service Worker
   Faz cache do "app shell" para permitir uso offline.
   Usa caminhos relativos ao próprio arquivo para funcionar em qualquer
   subdiretório (ex: https://usuario.github.io/studyhub/).
   ========================================================================== */

const CACHE_NAME = 'studyhub-cache-v1';

const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/utils.js',
  './js/storage.js',
  './js/render.js',
  './js/app.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: cache-first para o app shell, com atualização em segundo plano.
// Conteúdo externo (thumbnails do YouTube, fontes, favicons) segue direto para
// a rede e não é armazenado, já que depende de conexão por natureza.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (event.request.method !== 'GET' || !isSameOrigin) {
    return; // deixa passar (rede), sem interceptar recursos externos
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match('./index.html'));
      return cached || networkFetch;
    })
  );
});

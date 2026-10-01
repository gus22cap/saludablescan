// Service worker: guarda los archivos de la app para que abra rápido y sin internet.
// Usa "primero la red": si hay conexión, siempre trae la última versión.
const CACHE = 'saludablescan-v2';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './css/app.css',
  './js/app.js',
  './js/db.js',
  './js/api.js',
  './js/analisis.js',
  './js/aditivos.js',
  './js/escaner.js',
  './js/ui.js',
  './lib/dexie.min.js',
  './lib/zxing.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Solo manejamos los archivos propios; Open Food Facts va directo a internet.
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

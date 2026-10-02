// Service worker: guarda los archivos de la app para que abra rápido y sin internet.
// Archivos de la app: "primero la red" (si hay conexión, siempre trae la última versión).
// Fotos de productos: "primero lo guardado" (no cambian, y así se ven sin internet).
const CACHE = 'saludablescan-v8';
const CACHE_FOTOS = 'saludablescan-fotos'; // no se borra al actualizar la app
const MAX_FOTOS = 300;
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-180.png',
  './css/app.css',
  './js/app.js',
  './js/db.js',
  './js/api.js',
  './js/analisis.js',
  './js/aditivos.js',
  './js/escaner.js',
  './js/ui.js',
  './js/perfil.js',
  './js/personal.js',
  './js/comparar.js',
  './js/fotos.js',
  './js/lector-texto.js',
  './lib/tesseract.min.js',
  './lib/dexie.min.js',
  './lib/zxing.min.js',
];

self.addEventListener('install', (e) => {
  // "reload": baja los archivos frescos, no los que el navegador tenía guardados
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE && k !== CACHE_FOTOS).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Si hay demasiadas fotos guardadas, borra las más viejas
async function recortarFotos() {
  const cache = await caches.open(CACHE_FOTOS);
  const claves = await cache.keys();
  for (const vieja of claves.slice(0, Math.max(0, claves.length - MAX_FOTOS))) await cache.delete(vieja);
}

async function foto(request) {
  const cache = await caches.open(CACHE_FOTOS);
  const guardada = await cache.match(request);
  if (guardada) return guardada;
  const resp = await fetch(request);
  // Las fotos de otro sitio llegan "opacas" (status 0): igual se pueden guardar y mostrar
  if (resp.ok || resp.type === 'opaque') {
    await cache.put(request, resp.clone());
    recortarFotos();
  }
  return resp;
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Fotos de Open Food Facts
  if (url.hostname === 'images.openfoodfacts.org' || (url.hostname.endsWith('.openfoodfacts.org') && e.request.destination === 'image')) {
    e.respondWith(foto(e.request));
    return;
  }

  // Los datos de Open Food Facts y Precios Claros van directo a internet (la app ya los guarda aparte)
  if (url.origin !== location.origin) return;

  e.respondWith(
    // "no-cache": siempre pregunta al servidor si hay una versión nueva (si no cambió, la respuesta es mínima)
    fetch(e.request, { cache: 'no-cache' })
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

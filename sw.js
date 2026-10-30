// Guarda o app no aparelho para ele abrir rápido e funcionar mesmo sem internet.
// Arquivos do próprio app: tenta a internet primeiro (assim a versão nova chega sozinha) e usa a
// cópia guardada quando estiver offline. Bibliotecas e fontes, que nunca mudam no mesmo endereço,
// vêm direto da cópia guardada.

const CACHE = 'dados-de-arkham-v1';
const APP_FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'src/app.css', 'src/vendor.js', 'src/main.js',
  'src/lib/util.js', 'src/lib/canvas.js',
  'src/core/polyhedra.js', 'src/core/dice-sets.js', 'src/core/physics.js', 'src/core/stage.js',
  'src/themes/index.js',
  'src/themes/arkham/theme.js', 'src/themes/arkham/theme.css', 'src/themes/arkham/scene.js',
  'src/themes/arkham/dice-look.js', 'src/themes/arkham/audio.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
const LIBS = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js'
];
const LIB_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  // um arquivo que falhe não impede o resto de ser guardado
  event.waitUntil(caches.open(CACHE)
    .then(cache => Promise.all([...APP_FILES, ...LIBS].map(url => cache.add(url).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) event.respondWith(networkFirst(url.href));
  else if (LIB_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(request));
});

async function networkFirst(href) {
  const cache = await caches.open(CACHE);
  try {
    let response = await fetch(href, { cache: 'no-cache' });
    if (response.redirected) {
      response = new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers: response.headers });
    }
    if (response.ok) cache.put(href, response.clone());
    return response;
  } catch (e) {
    return (await cache.match(href, { ignoreSearch: true })) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

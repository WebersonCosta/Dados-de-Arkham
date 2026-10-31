// Guarda o app no aparelho para ele abrir rápido e funcionar mesmo sem internet.
// Cada versão fica guardada inteira, com um número próprio (RELEASE), e o app sempre abre da versão
// guardada. A seguinte é baixada inteira em segundo plano e só passa a valer depois de completa:
// uma atualização nunca deixa o app com uns arquivos novos e outros velhos. Bibliotecas e fontes,
// que nunca mudam no mesmo endereço, também ficam guardadas.

// O endereço oficial e o de teste ficam no mesmo site (webersoncosta.github.io) e dividem o mesmo
// lugar de guardar: cada um usa nomes próprios e só apaga as suas próprias cópias antigas.
const TEST = self.location.pathname.toLowerCase().startsWith('/dados-de-arkham-teste/');
const PREFIX = TEST ? 'dados-de-arkham-teste-v' : 'dados-de-arkham-v';
const RELEASE = 8;   // suba a cada envio (teste ou oficial): é o que avisa os aparelhos que há versão nova
const CACHE = PREFIX + RELEASE;
const APP_FILES = [
  './', 'index.html', TEST ? 'manifest-teste.webmanifest' : 'manifest.webmanifest',
  'src/app.css', 'src/vendor.js', 'src/version.js', 'src/main.js',
  'src/room-panel.js', 'src/room-log.js', 'src/room-label.js',
  'src/lib/util.js', 'src/lib/canvas.js',
  'src/core/polyhedra.js', 'src/core/dice-sets.js', 'src/core/formula.js', 'src/core/physics.js', 'src/core/stage.js',
  'src/core/room-link.js',
  'src/themes/index.js',
  'src/themes/arkham/theme.js', 'src/themes/arkham/theme.css', 'src/themes/arkham/scene.js',
  'src/themes/arkham/dice-look.js', 'src/themes/arkham/audio.js', 'src/themes/arkham/rules.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
const LIBS = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js'
];
const LIB_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(saveRelease().then(() => self.skipWaiting()));
});

// Baixa a versão inteira. O "?v=" faz o GitHub mandar o arquivo recém-publicado, e não uma cópia
// de alguns minutos atrás. Se faltar qualquer arquivo, a instalação falha e o aparelho continua
// com a versão anterior, completa (e tenta de novo na próxima vez que o app abrir).
async function saveRelease() {
  const cache = await caches.open(CACHE);
  try {
    await Promise.all(APP_FILES.map(async path => {
      const response = await fetch(`${path}?v=${RELEASE}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      // guardado pelo endereço sem o "?v=", que é o que a página pede
      const type = response.headers.get('Content-Type');
      await cache.put(path, new Response(await response.blob(), { headers: type ? { 'Content-Type': type } : {} }));
    }));
    await keepLibraries(cache);
  } catch (e) {
    await caches.delete(CACHE);
    throw e;
  }
}

// Bibliotecas e fontes passam da versão anterior, sem baixar de novo; só o que faltar vem da internet.
async function keepLibraries(cache) {
  for (const key of await caches.keys()) {
    if (!key.startsWith(PREFIX) || key === CACHE) continue;
    const old = await caches.open(key);
    for (const request of await old.keys()) {
      if (!LIB_HOSTS.includes(new URL(request.url).hostname)) continue;
      const hit = await old.match(request, { ignoreVary: true });
      if (hit) await cache.put(request, hit);
    }
  }
  await Promise.all(LIBS.map(async url => { if (!(await cache.match(url, { ignoreVary: true }))) await cache.add(url); }));
}

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) event.respondWith(fromRelease(request));
  else if (LIB_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(request));
});

// Arquivos do app: todos da versão guardada. Só o que não faz parte dela vem da internet.
async function fromRelease(request) {
  const hit = await (await caches.open(CACHE)).match(request, { ignoreSearch: true });
  return hit || fetch(request);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

// A página pergunta qual versão guardada a está servindo (aparece no canto, no endereço de teste).
self.addEventListener('message', event => {
  if (event.data === 'release') event.source?.postMessage({ release: RELEASE });
});

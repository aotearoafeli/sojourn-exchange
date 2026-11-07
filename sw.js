/* Sojourn Exchange — service worker (app shell + image cache) */
const SHELL = 'sojourn-shell-v1';
const IMG = 'sojourn-img-v1';
const CORE = ['./', './index.html', './css/style.css', './js/app.js', './data/properties.json', './assets/img/brand/mark.svg', './assets/img/brand/logo.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![SHELL, IMG].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin && /\/assets\/img\//.test(url.pathname)) {
    e.respondWith(caches.open(IMG).then(async c => { const hit = await c.match(e.request); if (hit) return hit; const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res; }));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request)));
  }
});

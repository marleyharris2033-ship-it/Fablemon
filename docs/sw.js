// Fablemon offline cache, build 20261124-112043. The page: network first, so players always get the newest version.
// The art (a/, named by content so a file never changes): kept in its own cache across updates, fetched once.
const CACHE = 'fablemon-20261124-112043', ART = 'fablemon-art';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== ART).map(k => caches.delete(k))))); self.clients.claim();
  // tidy art this version no longer uses, then quietly fetch the rest so the game also works offline
  fetch('a/files.json').then(r => r.json()).then(async list => {
    const c = await caches.open(ART), want = new Set(list.map(f => new URL(f, self.registration.scope).href));
    for (const q of await c.keys()) if (!want.has(q.url)) await c.delete(q);
    for (const u of want) if (!(await c.match(u))) { try { const r = await fetch(u); if (r.ok) await c.put(u, r); } catch (err) { return; } }
  }).catch(() => {});
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (new URL(e.request.url).pathname.includes('/a/')) {
    e.respondWith(caches.open(ART).then(c => c.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
});

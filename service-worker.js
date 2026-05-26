const CACHE = 'foxford-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() =>
        // Po aktivácii novej verzie SW — upozorni všetky otvorené karty aby sa reload-li
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
          .then(list => list.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // reset.html: vždy network, nikdy cache (núdzový escape)
  if (url.pathname.endsWith('/reset.html')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // version.json: vždy network (version check v index.js)
  if (url.pathname.endsWith('/version.json')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  const isNavigation = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');

  // Pre HTML navigáciu: network-first (aby user videl nový build hneď po deploy)
  if (isNavigation) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/')))
    );
    return;
  }

  // Pre asset súbory (hashed JS/CSS, obrázky): cache-first (rýchle, hashe sa menia pri builde)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url && c.focus);
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});

// Contapezzi Evento – funzionamento offline.
// Quando pubblichi una nuova versione, aumenta il numero qui sotto.
const VERSIONE = 'contapezzi-v2';
const FILE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
const ZXING = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(FILE).then(() => c.add(new Request(ZXING, { mode: 'cors' })).catch(() => {}))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSIONE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Solo i file dell'app: prima la rete (versione aggiornata), poi la copia salvata se sei offline.
// Le chiamate al Google Sheet non passano da qui.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.url === ZXING) {
    e.respondWith(caches.match(ZXING).then((r) => r || fetch(e.request).then((res) => {
      const copia = res.clone(); caches.open(VERSIONE).then((c) => c.put(ZXING, copia)); return res;
    })));
    return;
  }
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copia = res.clone();
        caches.open(VERSIONE).then((c) => c.put(e.request, copia));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});

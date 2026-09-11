const CACHE_NAME = 'polaris-star-map-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './fonts/BMDoHyeon.woff',
  './fonts/Baloo2-Bold.woff2',
  './fonts/Baloo2-SemiBold.woff2',
  './fonts/JetBrainsMono-Regular.woff2',
  './fonts/PretendardVariable.woff2',
];

const scopedUrl = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL.map(scopedUrl)))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name.startsWith('polaris-star-map-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(scopedUrl('./index.html'), copy));
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) || (await caches.match(scopedUrl('./index.html')))
        )
    );
    return;
  }

  // 해시가 붙은 빌드 파일, 폰트, JSON, 삽화는 빠르게 캐시를 돌려주면서
  // 뒤에서 최신 파일로 갱신한다. 아직 제작되지 않은 삽화의 404는 저장하지 않는다.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});


// 이지쉐프 오프라인용 서비스 워커
// 앱을 고쳐서 새로 올릴 때마다 아래 버전 번호를 하나씩 올립니다. (예: v1 -> v2)
const VERSION = 'v1';
const CACHE_NAME = 'easy-chef-' + VERSION;

// 처음 설치할 때 미리 저장해 둘 파일 (index.html 옆에 있는 파일들)
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// 옛 버전 저장 공간은 지웁니다.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('easy-chef-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 인터넷이 되면 최신 파일을 받아 오고, 안 되면 저장해 둔 파일로 엽니다.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 구글 폼 등 다른 사이트 요청은 건드리지 않습니다.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
  );
});

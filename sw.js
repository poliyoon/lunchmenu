/* lunchmune PWA Service Worker */
const CACHE_NAME = "lunchmune-static-v2"; // 버전 올려 캐시 무효화
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./썸네일.png",
  "./점심메뉴 이미지.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

// 네비게이션: 네트워크 우선, 실패 시 index.html
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match("./index.html");
        return cached || new Response("오프라인입니다.", { status: 503 });
      }
    })());
    return;
  }

  // 동일 출처 정적 파일: 캐시 우선
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return cached || fetch(req).then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          return resp;
        });
      })
    );
  }
});

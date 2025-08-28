/* lunchmune PWA Service Worker */
const CACHE_NAME = "lunchmune-static-v1";
const ASSETS = [
  "./",
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
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

/* 전략:
 * - HTML(네비게이션 요청): 네트워크 우선, 실패 시 캐시된 index.html
 * - 정적자원(같은 출처): 캐시 우선
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 네비게이션(페이지 이동)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("./index.html");
          return cached || new Response("오프라인입니다.", { status: 503 });
        }
      })()
    );
    return;
  }

  // 정적 파일: 캐시 우선
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((resp) => {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
            return resp;
          })
        );
      })
    );
  }
});

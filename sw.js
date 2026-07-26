const CACHE_NAME = "kasen-tenkenshi-v1.3.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=1.3.0",
  "./photo-questions.js?v=1.3.0",
  "./questions.js?v=1.3.0",
  "./app.js?v=1.3.0",
  "./manifest.webmanifest?v=1.3.0",
  "./assets/icon.svg?v=1.3.0",
  "./assets/icon-180.png?v=1.3.0",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/launch.jpg",
  "./assets/finish.jpg",
  ...Array.from({ length: 40 }, (_, index) => `./assets/questions/Q${String(index + 1).padStart(3, "0")}.jpg`)
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fresh = fetch(event.request)
        .then((response) => {
          if (response.ok && new URL(event.request.url).origin === self.location.origin) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => cached || caches.match("./index.html"));
      return cached || fresh;
    })
  );
});

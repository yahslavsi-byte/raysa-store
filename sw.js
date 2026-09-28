/* =====================================================
   Service Worker Raysa Store
   Update: auto-detect versi baru
   ===================================================== */

const CACHE_VERSION = "raysa-v1.0.0";
const ASSETS = [
  "/",
  "/index.html",
  "/admin.html",
  "/style.css",
  "/data.js",
  "/script.js",
  "/admin.js",
  "/firebase-config.js",
  "/app-version.js"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      cache.addAll(ASSETS).catch(err => console.warn("Cache err:", err))
    )
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  if (event.request.url.includes("firebase") ||
      event.request.url.includes("gstatic") ||
      event.request.url.includes("googleapis")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Message dari halaman → skip waiting
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
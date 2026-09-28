/* =====================================================
   Service Worker Raysa Store - NETWORK FIRST
   Prioritas ambil dari server, cache hanya fallback
   ===================================================== */

const CACHE_VERSION = "raysa-v1.0.0";

// Install — langsung aktif
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate — hapus semua cache lama
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch — network first, cache fallback
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Skip Firebase & external — biarkan langsung ke network
  if (event.request.url.includes("firebase") ||
      event.request.url.includes("gstatic") ||
      event.request.url.includes("googleapis") ||
      event.request.url.includes("ui-avatars")) {
    return;
  }

  // Network first untuk SEMUA file
  event.respondWith(
    fetch(event.request)
      .then(res => {
        // Update cache di background
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Skip waiting
self.addEventListener("message", e => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
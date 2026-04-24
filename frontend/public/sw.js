const STATIC_CACHE = "pfd-static-v1";
const API_CACHE = "pfd-api-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/maskable-icon.svg",
];

const isApiRequest = (requestUrl) => requestUrl.pathname.startsWith("/api/v1/");

const networkFirst = async (request, cacheName, fallbackUrl = null) => {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    if (fallbackUrl) {
      return cache.match(fallbackUrl);
    }

    throw error;
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) => ![STATIC_CACHE, API_CACHE].includes(cacheName),
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (isApiRequest(requestUrl)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, STATIC_CACHE, "/index.html"));
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches
            .open(STATIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
          return networkResponse;
        });
      }),
    );
  }
});

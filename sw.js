/* PeerCall service worker. ES5 syntax keeps early service-worker browsers usable. */
var CACHE_NAME = "peercall-app-v3";
var APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/vendor/polyfills.min.js",
  "./js/vendor/css-vars-ponyfill.min.js",
  "./js/compat.js",
  "./js/vendor/peerjs.min.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/favicon-32.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(APP_SHELL);
  }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key !== CACHE_NAME;
    }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || request.url.indexOf(self.location.origin) !== 0) return;

  var acceptsHtml = request.headers.get("accept") && request.headers.get("accept").indexOf("text/html") !== -1;
  if (request.mode === "navigate" || acceptsHtml) {
    event.respondWith(fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || caches.match("./index.html") || caches.match("./");
      });
    }));
    return;
  }

  event.respondWith(caches.match(request).then(function (cached) {
    var update = fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () { return cached; });
    if (cached) {
      event.waitUntil(update);
      return cached;
    }
    return update;
  }));
});

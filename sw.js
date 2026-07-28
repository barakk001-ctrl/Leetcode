const CACHE = "kotlin-grind-v4";
const SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "data/week1.js", "data/week2.js", "data/week3.js", "data/week4.js",
  "data/week5.js", "data/week6.js", "data/week7.js", "data/week8.js", "data/week9.js",
  "data/learn1.js", "data/learn2.js", "data/learn3.js", "data/learn4.js",
  "data/learn5.js", "data/learn6.js", "data/learn7.js", "data/learn8.js", "data/learn9.js",
  "data/links.js",
  "vendor/codemirror/codemirror.min.css", "vendor/codemirror/codemirror.min.js",
  "vendor/codemirror/clike.min.js", "vendor/codemirror/show-hint.min.js",
  "vendor/codemirror/show-hint.min.css", "vendor/codemirror/matchbrackets.min.js",
  "vendor/codemirror/closebrackets.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) return; // sync always goes to the network

  // network-first so deploys show up immediately; cache is the offline fallback
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        if (e.request.method === "GET" && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return resp;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html"))
      )
  );
});

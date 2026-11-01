/* Service worker do Tibia Farm Tracker: deixa o site abrir offline e mais rápido.
   Só cuida de arquivos do próprio site e das bibliotecas do Firebase; nunca guarda dados da conta (Firestore/Auth passam direto). */
var VERSAO = "v1";
var C_SHELL = "tft-shell-" + VERSAO, C_DADOS = "tft-dados-" + VERSAO, C_LIB = "tft-lib-" + VERSAO;
var PRE_SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];
var PRE_DADOS = ["/hunts.json", "/itens-delivery.json"];
var PRE_LIB = [
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"
];
function guardar(nome, urls, opts) {
  return caches.open(nome).then(function (c) {
    return Promise.all(urls.map(function (u) {
      return fetch(u, opts || {}).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {});
    }));
  });
}
self.addEventListener("install", function (e) {
  e.waitUntil(Promise.all([guardar(C_SHELL, PRE_SHELL), guardar(C_DADOS, PRE_DADOS), guardar(C_LIB, PRE_LIB, { mode: "cors" })]).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("tft-") === 0 && [C_SHELL, C_DADOS, C_LIB].indexOf(k) === -1; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function redeComTempo(req, ms) {
  return new Promise(function (ok, no) {
    var t = setTimeout(function () { no(new Error("tempo")); }, ms);
    fetch(req).then(function (r) { clearTimeout(t); ok(r); }, function (er) { clearTimeout(t); no(er); });
  });
}
/* rede primeiro, cache se estiver offline ou lento */
function redePrimeiro(req, cacheNome, fallbackUrl, ms) {
  return redeComTempo(req, ms || 6000).then(function (r) {
    if (r && r.ok) { var cp = r.clone(); caches.open(cacheNome).then(function (c) { c.put(req, cp); }); }
    return r;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (m) { return m || (fallbackUrl ? caches.match(fallbackUrl) : undefined) || Response.error(); });
  });
}
/* cache primeiro, atualiza em segundo plano */
function cachePrimeiro(req, cacheNome) {
  return caches.match(req).then(function (m) {
    var rede = fetch(req).then(function (r) { if (r && (r.ok || r.type === "opaque")) { var cp = r.clone(); caches.open(cacheNome).then(function (c) { c.put(req, cp); }); } return r; }).catch(function () { return m; });
    return m || rede;
  });
}
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  var u = new URL(req.url);
  if (u.origin === self.location.origin) {
    if (u.pathname === "/sw.js") return;
    if (req.mode === "navigate") { e.respondWith(redePrimeiro(req, C_SHELL, "/", 4000)); return; }
    if (/\.json$/.test(u.pathname)) { e.respondWith(redePrimeiro(req, C_DADOS, null, 8000)); return; }
    e.respondWith(cachePrimeiro(req, C_SHELL));
    return;
  }
  /* bibliotecas do Firebase (versão fixa na URL) e fontes: cache primeiro */
  if (u.hostname === "www.gstatic.com" && u.pathname.indexOf("/firebasejs/") === 0) { e.respondWith(cachePrimeiro(req, C_LIB)); return; }
  if (u.hostname === "fonts.googleapis.com" || (u.hostname === "fonts.gstatic.com")) { e.respondWith(cachePrimeiro(req, C_LIB)); return; }
  /* todo o resto (Firestore, login Google, AdSense, etc.) passa direto, sem cache */
});

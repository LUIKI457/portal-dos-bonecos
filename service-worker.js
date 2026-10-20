// Versão do cache. Aumente este número quando trocar os ícones ou outros arquivos fixos.
const CACHE = "portal-dos-bonecos-v1";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Só guarda arquivos do próprio site. Fontes e outros sites seguem direto para a rede.
  if (url.origin !== self.location.origin) return;

  // Páginas: rede primeiro, para sempre receber a versão nova. Sem internet, usa a cópia salva.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copia));
          return r;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Ícones e manifesto: cache primeiro, com atualização na rede quando não houver cópia.
  e.respondWith(
    caches.match(req).then((achado) => achado || fetch(req).then((r) => {
      if (r.ok) {
        const copia = r.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
      }
      return r;
    }))
  );
});

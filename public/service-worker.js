// service-worker.js
// Этап 1-2: установка PWA + офлайн-чтение (кэш клиентов/абонементов).
// Этап 3 (офлайн-запись/очередь чек-инов) добавляется отдельно поверх этого файла.

const CACHE_VERSION = "gym-crm-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Файлы, без которых приложение не откроется офлайн вообще
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html", // простая заглушка "нет соединения", создать в /public
];

// --- Установка: кладём статику в кэш сразу ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// --- Активация: чистим старые версии кэша ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("gym-crm-") && key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// --- Перехват запросов ---
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Не GET (Server Actions, будущие мутации) — не трогаем, Cache API не
  // поддерживает кэширование не-GET запросов и будет падать на cache.put().
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // API-запросы (список клиентов, абонементы и т.п.) — network-first,
  // при неудаче отдаём последнюю закэшированную версию
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Статика и страницы — cache-first, при отсутствии в кэше идём в сеть
  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    // Кэшируем только успешные GET-ответы
    if (request.method === "GET" && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Если это GET без кэша — отдаём пустой JSON, чтобы UI не падал
    return new Response(JSON.stringify({ offline: true, data: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Нет сети и нет в кэше — показываем офлайн-заглушку для страниц
    if (request.mode === "navigate") {
      return caches.match("/offline.html");
    }
    throw err;
  }
}

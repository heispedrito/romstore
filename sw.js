// sw.js - Service Worker para PWA ROM STORE

const CACHE_NAME = 'rom-store-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/logovertical.png',
  '/favicon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación del Service Worker y Caché inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierto con éxito');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de Intercepción: Stale-While-Revalidate (prioriza velocidad, actualiza en fondo)
self.addEventListener('fetch', event => {
  // Evitamos interceptar peticiones a la base de datos de Supabase para tener siempre datos frescos
  if (event.request.url.includes('supabase.co') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {
          // Fallback offline básico
        });
        
        return cachedResponse || fetchPromise;
      })
  );
});
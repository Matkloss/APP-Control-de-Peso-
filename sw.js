// NutriAI Service Worker — v1.0
const CACHE = 'nutriai-v1';
const ASSETS = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js',
];

// Instalar — cachear assets principales
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

// Activar — limpiar caches viejos
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache first para assets, network first para API calls
self.addEventListener('fetch', e=>{
  const url = e.request.url;

  // No cachear llamadas a APIs externas
  if(url.includes('anthropic.com') || url.includes('firestore.googleapis.com')){
    return; // dejar pasar sin caché
  }

  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(response=>{
        // Cachear respuestas exitosas de assets estáticos
        if(response.ok && e.request.method==='GET'){
          const clone = response.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return response;
      }).catch(()=>cached); // si no hay red, usar caché
    })
  );
});

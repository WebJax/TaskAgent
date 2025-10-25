// Service Worker for TaskAgent PWA
const CACHE_NAME = 'taskagent-v1.0.2';
const urlsToCache = [
  '/',
  '/app.js',
  '/reports.js',
  '/manifest.json'
  // Removed favicon.ico to avoid 404 errors
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache files one by one to avoid failing on 404s
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.log('Failed to cache:', url))
          )
        );
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip chrome-extension and non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Only cache GET requests - POST, PUT, DELETE cannot be cached
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        // Important: Clone the request because it's a stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Important: Clone the response because it's a stream
          const responseToCache = response.clone();

          // Cache successful GET responses
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // If network fails and we don't have cache, return offline page
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Background sync for when connection returns
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Push notification handling
self.addEventListener('push', event => {
  
  const options = {
    body: event.data ? event.data.text() : 'Ny opdatering tilgængelig',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Åbn TaskAgent',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Luk',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('TaskAgent', options)
  );
});

// Sync data when connection returns
async function syncData() {
  try {
    // Here you would sync any offline changes back to server
    
    // Example: Send any pending tasks, timer data, etc.
    const pendingData = await getStoredPendingData();
    if (pendingData.length > 0) {
      await syncPendingData(pendingData);
    }
    
  } catch (error) {
  }
}

async function getStoredPendingData() {
  // Get data from IndexedDB or localStorage
  return [];
}

async function syncPendingData(data) {
  // Send data to server
  return Promise.resolve();
}

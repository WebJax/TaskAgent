// Service Worker for TaskAgent PWA
const CACHE_NAME = 'taskagent-v1.0.0';
const urlsToCache = [
  '/',
  '/app.js',
  '/reports',
  '/reports.js',
  '/manifest.json',
  // Cache API endpoints for offline support
  '/tasks',
  '/clients', 
  '/projects',
  '/recurring-completions'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
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

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
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

          // Cache successful responses
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
  console.log('Service Worker: Background sync triggered');
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Push notification handling
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
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
    console.log('Service Worker: Syncing data...');
    
    // Example: Send any pending tasks, timer data, etc.
    const pendingData = await getStoredPendingData();
    if (pendingData.length > 0) {
      await syncPendingData(pendingData);
    }
    
    console.log('Service Worker: Data sync complete');
  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
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

const CACHE_NAME = 'poker-cash-flow-v1';
const urlsToCache = [
  '/PokerCashFlow/',
  '/PokerCashFlow/index.html',
  '/PokerCashFlow/dashboard',
  '/PokerCashFlow/players',
  '/PokerCashFlow/sessions',
  '/PokerCashFlow/groups',
  '/PokerCashFlow/settings',
  '/PokerCashFlow/manifest.json',
  '/PokerCashFlow/favicon.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle SPA routing - serve index.html for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/PokerCashFlow/index.html')
        .then(response => {
          return response || fetch(request);
        })
        .catch(() => {
          return caches.match('/PokerCashFlow/index.html');
        })
    );
    return;
  }

  // Handle API requests - network first, cache fallback
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          const responseClone = response.clone();
          
          // Only cache successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then(response => {
            if (response) {
              // Add offline indicator to cached data
              return response;
            }
            // Return offline fallback for API requests
            return new Response(
              JSON.stringify({ 
                error: 'Offline', 
                message: 'You are currently offline. Some data may be outdated.' 
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Handle static assets - cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Fetch from network and cache
        return fetch(request).then(response => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline fallback for HTML pages
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/PokerCashFlow/index.html');
        }
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(
      // Implement background sync logic here
      // E.g., send queued data when online
      Promise.resolve()
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  console.log('📱 Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New poker session available!',
    icon: '/PokerCashFlow/icon-192x192.png',
    badge: '/PokerCashFlow/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/PokerCashFlow/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/PokerCashFlow/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Poker Cash Flow', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('📱 Notification clicked');
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/PokerCashFlow/dashboard')
    );
  }
}); 
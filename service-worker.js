self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Instantly activate
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
});

self.addEventListener('fetch', (event) => {
  // For now, just let requests go to the network normally
});


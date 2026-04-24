/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { matchPrecache, precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

const OFFLINE_PAGE_URL = '/offline.html';
const OFFLINE_CACHE_NAME = 'offline-cache-v4';
const SETTINGS_API_PATTERN = /^https:\/\/api\.bot-t\.com\/v1\/bot-module\/settings/;
const INSTRUCTIONS_API_PATTERN = /\/api\/v1\/key-activate\/vpn-instructions/;

void self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_PAGE_URL))
      .catch(() => {}),
  );
});

// Enable navigation preload to speed up navigations on supported browsers.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })(),
  );
});

registerRoute(
  ({ request, sameOrigin }) =>
    sameOrigin &&
    (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker'),
  new StaleWhileRevalidate({
    cacheName: 'static-resources-v2',
  }),
);

// Шрифты: обновления из нового деплоя подтягиваются быстрее, чем у «тяжёлых» картинок.
registerRoute(
  ({ request, sameOrigin }) => sameOrigin && request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'font-resources-v2',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 60 * 60 * 24 * 90,
      }),
    ],
  }),
);

registerRoute(
  ({ request, sameOrigin }) => sameOrigin && request.destination === 'image',
  new CacheFirst({
    cacheName: 'media-images-v2',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => request.method === 'GET' && SETTINGS_API_PATTERN.test(url.href),
  new NetworkFirst({
    cacheName: 'api-settings-v2',
    networkTimeoutSeconds: 2,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 6,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => request.method === 'GET' && INSTRUCTIONS_API_PATTERN.test(url.href),
  new NetworkFirst({
    cacheName: 'api-instructions-v2',
    networkTimeoutSeconds: 2,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 15,
      }),
    ],
  }),
);

registerRoute(
  new NavigationRoute(async ({ event }) => {
    const preloadResponse = await event.preloadResponse;

    if (preloadResponse) {
      return preloadResponse;
    }

    try {
      const cachedAppShell = (await matchPrecache('/index.html')) ?? (await matchPrecache('/'));

      if (cachedAppShell) {
        return cachedAppShell;
      }

      return await fetch(event.request);
    } catch {
      const cachedOffline = await caches.match(OFFLINE_PAGE_URL);

      return cachedOffline ?? Response.error();
    }
  }),
);

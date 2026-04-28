/**
 * Cache Storage API — по мотивам telegram-tt `src/util/cacheApi.ts`.
 * Без глобальных `setInterval` на импорте: периодическая очистка через `scheduleCacheApiCleanup()` с главного потока.
 */

const cachesApi = typeof caches !== 'undefined' ? caches : undefined;

const LAST_ACCESS_HEADER = 'X-Last-Access';

/** Имена bucket'ов Cache Storage */
export const CACHE_NAME_EMOJI_TGS = 'vpn-emoji-tgs-v1';
export const CACHE_NAME_API_GET = 'vpn-api-get-v1';

/** TTL с момента последнего доступа (удаление в cleanup) */
export const CACHE_TTL_EMOJI_MS = 5 * 24 * 60 * 60 * 1000; // 5 суток
export const CACHE_TTL_API_GET_MS = 30 * 60 * 1000; // 30 минут

/** Не чаще обновлять заголовок last-access при чтении */
export const CACHE_ACCESS_THROTTLE_EMOJI_MS = 24 * 60 * 60 * 1000; // 1 сутки
export const CACHE_ACCESS_THROTTLE_API_MS = 5 * 60 * 1000; // 5 минут

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 час

let ttlEmojiMs = CACHE_TTL_EMOJI_MS;
let ttlApiGetMs = CACHE_TTL_API_GET_MS;

const ACCESS_THROTTLE_BY_NAME: Record<string, number> = {
  [CACHE_NAME_EMOJI_TGS]: CACHE_ACCESS_THROTTLE_EMOJI_MS,
  [CACHE_NAME_API_GET]: CACHE_ACCESS_THROTTLE_API_MS,
};

let isSupported: boolean | undefined;
let cleanupTimer: ReturnType<typeof setInterval> | undefined;

export async function isCacheApiSupported(): Promise<boolean> {
  if (!cachesApi) {
    return false;
  }

  if (isSupported === undefined) {
    isSupported = await cachesApi
      .open('__vpn_cache_probe__')
      .then(() => true)
      .catch(() => false);
    if (isSupported) {
      void cachesApi.delete('__vpn_cache_probe__');
    }
  }

  return isSupported;
}

export enum CacheApiType {
  Text,
  Blob,
  Json,
  ArrayBuffer,
}

function requestKeyForCache(key: string): Request {
  return new Request(key.replace(/:/g, '_'));
}

function accessThrottleMs(cacheName: string): number {
  return ACCESS_THROTTLE_BY_NAME[cacheName] ?? CACHE_ACCESS_THROTTLE_EMOJI_MS;
}

export async function cacheApiFetch(
  cacheName: string,
  key: string,
  type: CacheApiType,
  isHtmlAllowed = false,
): Promise<string | Blob | ArrayBuffer | undefined> {
  if (!cachesApi) {
    return undefined;
  }

  try {
    const request = requestKeyForCache(key);
    const cache = await cachesApi.open(cacheName);
    const response = await cache.match(request);
    if (!response) {
      return undefined;
    }

    const lastAccess = Number(response.headers.get(LAST_ACCESS_HEADER));
    const now = Date.now();
    if (!lastAccess || now - lastAccess > accessThrottleMs(cacheName)) {
      void updateAccessTime(cache, request, response);
    }

    const contentType = response.headers.get('Content-Type');

    switch (type) {
      case CacheApiType.Text:
        return await response.text();
      case CacheApiType.Blob: {
        if (key.startsWith('avatar') && contentType?.startsWith('text')) {
          return undefined;
        }

        const blob = await response.blob();
        const shouldRecreate = !blob.type || (!isHtmlAllowed && blob.type.includes('html'));
        let resolvedType = blob.type || contentType || '';

        if (!(shouldRecreate && resolvedType)) {
          return blob;
        }

        if (!isHtmlAllowed) {
          resolvedType = resolvedType.replace(/html/gi, '');
        }

        return new Blob([blob], { type: resolvedType });
      }
      case CacheApiType.Json:
        return await response.json();
      case CacheApiType.ArrayBuffer:
        return await response.arrayBuffer();
      default:
        return undefined;
    }
  } catch (err) {
    console.warn('[cacheApi] fetch', err);
    return undefined;
  }
}

export async function cacheApiSave(
  cacheName: string,
  key: string,
  data: Blob | ArrayBuffer | string,
): Promise<boolean> {
  if (!cachesApi) {
    return false;
  }

  try {
    const cacheData =
      typeof data === 'string' || data instanceof Blob || data instanceof ArrayBuffer
        ? data
        : JSON.stringify(data);
    const request = requestKeyForCache(key);
    const response = new Response(cacheData as BodyInit);
    response.headers.set(LAST_ACCESS_HEADER, Date.now().toString());
    const cache = await cachesApi.open(cacheName);
    await cache.put(request, response);

    return true;
  } catch (err) {
    console.warn('[cacheApi] save', err);
    return false;
  }
}

export async function cacheApiRemove(cacheName: string, key: string): Promise<boolean | undefined> {
  if (!cachesApi) {
    return undefined;
  }

  try {
    const cache = await cachesApi.open(cacheName);
    return await cache.delete(requestKeyForCache(key));
  } catch (err) {
    console.warn('[cacheApi] remove', err);
    return undefined;
  }
}

export async function cacheApiClear(cacheName: string): Promise<boolean | undefined> {
  if (!cachesApi) {
    return undefined;
  }

  try {
    return await cachesApi.delete(cacheName);
  } catch (err) {
    console.warn('[cacheApi] clear', err);
    return undefined;
  }
}

/** Удаляет записи старше ttlMs от последнего доступа. */
export async function cacheApiCleanup(cacheName: string, ttlMs: number): Promise<void> {
  if (!cachesApi) {
    return;
  }

  try {
    const cache = await cachesApi.open(cacheName);
    const keys = await cache.keys();
    const now = Date.now();

    for (const request of keys) {
      const response = await cache.match(request);
      if (!response) {
        continue;
      }

      const lastAccess = Number(response.headers.get(LAST_ACCESS_HEADER));
      if (lastAccess && now - lastAccess > ttlMs) {
        await cache.delete(request);
      }
    }
  } catch (err) {
    console.warn('[cacheApi] cleanup', err);
  }
}

export function configureCacheApiTtl(opts: { emojiMs?: number; apiGetMs?: number }): void {
  if (typeof opts.emojiMs === 'number' && Number.isFinite(opts.emojiMs) && opts.emojiMs > 0) {
    ttlEmojiMs = Math.floor(opts.emojiMs);
  }
  if (typeof opts.apiGetMs === 'number' && Number.isFinite(opts.apiGetMs) && opts.apiGetMs > 0) {
    ttlApiGetMs = Math.floor(opts.apiGetMs);
  }
}

export async function cacheApiCleanupAll(): Promise<void> {
  await cacheApiCleanup(CACHE_NAME_EMOJI_TGS, ttlEmojiMs);
  await cacheApiCleanup(CACHE_NAME_API_GET, ttlApiGetMs);
}

/** Вызвать один раз с главного потока (например из boot). В воркерах не вызывать. */
export function scheduleCacheApiCleanup(): void {
  if (typeof window === 'undefined' || cleanupTimer !== undefined) {
    return;
  }

  void cacheApiCleanupAll();
  cleanupTimer = setInterval(() => {
    void cacheApiCleanupAll();
  }, CLEANUP_INTERVAL_MS);
}

async function updateAccessTime(cache: Cache, request: Request, response: Response): Promise<void> {
  try {
    const headers = new Headers(response.headers);
    headers.set(LAST_ACCESS_HEADER, Date.now().toString());
    const newResponse = new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    await cache.put(request, newResponse);
  } catch (err) {
    console.warn('[cacheApi] updateAccessTime', err);
  }
}

export async function purgeVpnMediaCaches(): Promise<void> {
  await cacheApiClear(CACHE_NAME_EMOJI_TGS);
  await cacheApiClear(CACHE_NAME_API_GET);
}

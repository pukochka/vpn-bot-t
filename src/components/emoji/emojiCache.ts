/// <reference lib="webworker" />

import {
  cacheApiFetch,
  cacheApiSave,
  CACHE_NAME_EMOJI_TGS,
  CacheApiType,
  isCacheApiSupported,
} from 'src/utils/cacheApi';

function normalizeCacheKey(tgsUrl: string): string {
  try {
    return new URL(tgsUrl, self.location?.origin || 'https://local.invalid').href;
  } catch {
    return tgsUrl.trim();
  }
}

/**
 * Загружает байты `.tgs` (или JSON) с cache-first через Cache Storage, затем сеть.
 * Используется из `emojiRlottie.worker.ts`.
 */
export async function fetchTgsAsUint8Array(tgsUrl: string): Promise<Uint8Array> {
  const key = normalizeCacheKey(tgsUrl);

  if (await isCacheApiSupported()) {
    const cached = await cacheApiFetch(CACHE_NAME_EMOJI_TGS, key, CacheApiType.ArrayBuffer);
    if (cached instanceof ArrayBuffer && cached.byteLength > 0) {
      return new Uint8Array(cached);
    }
  }

  const response = await fetch(tgsUrl, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`[emojiCache] Failed to fetch ${key}: HTTP ${response.status}`);
  }

  const buf = new Uint8Array(await response.arrayBuffer());

  if ((await isCacheApiSupported()) && buf.byteLength > 0) {
    const toStore =
      buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength
        ? buf.buffer
        : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    void cacheApiSave(CACHE_NAME_EMOJI_TGS, key, toStore);
  }

  return buf;
}

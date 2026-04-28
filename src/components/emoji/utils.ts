import { gunzipSync } from 'fflate';

/** Gzip magic bytes (Telegram .tgs) */
const GZIP_MAGIC_1 = 0x1f;
const GZIP_MAGIC_2 = 0x8b;

/**
 * Асинхронная распаковка gzip через DecompressionStream (предпочтительно) или fflate.
 */
export async function gunzipToString(buffer: Uint8Array): Promise<string> {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
      return await new Response(stream).text();
    } catch {
      // fall through
    }
  }
  return new TextDecoder().decode(gunzipSync(buffer));
}

export async function loadTgsJsonFromBytes(buffer: Uint8Array): Promise<unknown> {
  if (buffer.length >= 2 && buffer[0] === GZIP_MAGIC_1 && buffer[1] === GZIP_MAGIC_2) {
    const jsonStr = await gunzipToString(buffer);
    return JSON.parse(jsonStr) as unknown;
  }
  return JSON.parse(new TextDecoder().decode(buffer)) as unknown;
}

/**
 * Загружает .tgs (gzip + Lottie JSON) или сырой JSON по URL.
 * Аналог extractJson в telegram-tt `rlottie.worker.ts`.
 */
export async function loadTgsJson(tgsUrl: string): Promise<unknown> {
  const response = await fetch(tgsUrl);
  if (!response.ok) {
    throw new Error(`[emoji] Failed to fetch ${tgsUrl}: ${response.status}`);
  }

  const contentType = response.headers.get('Content-Type') ?? '';

  if (contentType.startsWith('text/')) {
    return JSON.parse(await response.text()) as unknown;
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  return loadTgsJsonFromBytes(buffer);
}

export function generateUniqueId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

const DEFAULT_CUSTOM_EMOJI_STORAGE_BASE =
  'https://storage.bot-market.com/bots_catalog/custom-emoji';

/**
 * URL `.tgs` custom emoji по `document_id`.
 * `baseUrl` — из `config.proxyStars.customEmojiFetchBase` (prod: storage, dev: прокси или прямой URL).
 */
export function resolveCustomEmojiApiUrl(
  documentId: string,
  baseUrl: string = DEFAULT_CUSTOM_EMOJI_STORAGE_BASE,
): string {
  const id = String(documentId).trim();
  if (!id) {
    return '';
  }
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}/${encodeURIComponent(id)}`;
}

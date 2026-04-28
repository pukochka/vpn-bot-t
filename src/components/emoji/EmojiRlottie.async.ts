import type EmojiRlottie from './EmojiRlottie';

let promise: Promise<typeof EmojiRlottie> | undefined;
let cached: typeof EmojiRlottie | undefined;
const LOTTIE_LOAD_DELAY = 3000;

/**
 * Ленивая загрузка движка .tgs (RLottie WASM + worker, как в telegram-tt).
 * Отдельный чанк — не раздувает initial bundle.
 */
export async function ensureEmojiRlottie(): Promise<typeof EmojiRlottie> {
  if (!promise) {
    promise = import('./EmojiRlottie')
      .then((m) => {
        void m.prewarmEmojiRlottieRuntime();
        return m.default;
      })
      .catch((error) => {
        promise = undefined;
        throw error;
      });
  }
  cached = await promise;
  return cached;
}

/** После первого успешного `ensureEmojiRlottie()` возвращает класс без async. */
export function getEmojiRlottieSync(): typeof EmojiRlottie | undefined {
  return cached;
}

setTimeout(() => {
  void ensureEmojiRlottie();
}, LOTTIE_LOAD_DELAY);

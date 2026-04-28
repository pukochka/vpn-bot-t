export { default as CustomEmoji } from './CustomEmoji.vue';
export { default as CustomEmojiTgs } from './CustomEmojiTgs.vue';
export { ensureEmojiRlottie, getEmojiRlottieSync } from './EmojiRlottie.async';
export { fetchTgsAsUint8Array } from './emojiCache';
export {
  loadTgsJson,
  loadTgsJsonFromBytes,
  gunzipToString,
  generateUniqueId,
  resolveCustomEmojiApiUrl,
} from './utils';
export { default as EmojiRlottie } from './EmojiRlottie';
export type { EmojiRlottieParams } from './EmojiRlottie';

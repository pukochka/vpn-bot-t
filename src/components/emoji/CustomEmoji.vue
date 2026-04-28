<template>
  <div
    class="bm-custom-emoji custom-emoji emoji"
    :class="className"
    :style="rootStyle"
    :data-document-id="documentIdAttr"
    data-entity-type="MessageEntityCustomEmoji"
    :data-alt="altAttr"
  >
    <CustomEmojiTgs
      v-if="resolvedSrc"
      class="bm-custom-emoji__tgs"
      :autoplay="autoplay"
      :is-low-priority="isLowPriority"
      :loop="innerLoop"
      :loop-limit="loopLimit"
      :no-play="noPlay"
      :play-on-hover="playOnHover"
      :quality="quality"
      :should-not-loop="shouldNotLoop"
      :size="size"
      :speed="speed"
      :src="resolvedSrc"
      :with-shared-animation="withSharedAnimation"
      @animation-end="onAnimationEnd"
      @error="onLoadError"
      @load="onLoad"
    />

    <div v-if="showPlaceholder" aria-hidden="true" class="bm-custom-emoji__placeholder" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import config from 'src/utils/config';
import CustomEmojiTgs from './CustomEmojiTgs.vue';
import { resolveCustomEmojiApiUrl } from './utils';

const props = withDefaults(
  defineProps<{
    /** URL `.tgs` для рендера; имеет приоритет над `documentId`. */
    src?: string;
    /** Telegram `document_id`: `data-document-id` и загрузка с storage API, если нет `src`. */
    documentId?: string;
    /** Подпись для `data-alt` (unicode fallback). */
    alt?: string;
    className?: string;
    size?: number;
    noPlay?: boolean;
    /** Сколько полных циклов проиграть (как `loopLimit` в telegram-tt). */
    loopLimit?: number;
    shouldNotLoop?: boolean;
    withSharedAnimation?: boolean;
    loop?: boolean;
    autoplay?: boolean;
    playOnHover?: boolean;
    quality?: number;
    isLowPriority?: boolean;
    speed?: number;
  }>(),
  {
    size: 20,
    noPlay: false,
    shouldNotLoop: false,
    withSharedAnimation: false,
    loop: true,
    autoplay: true,
    playOnHover: false,
    quality: 1,
    isLowPriority: false,
    speed: 1,
  },
);

const emit = defineEmits<{
  load: [];
  'animation-end': [];
}>();

const loaded = ref(false);
const loadFailed = ref(false);

const documentIdAttr = computed(() => props.documentId ?? undefined);
const altAttr = computed(() => props.alt ?? undefined);

const resolvedSrc = computed(() => {
  const fromSrc = props.src?.trim();
  if (fromSrc) {
    return fromSrc;
  }
  const id = props.documentId?.trim();
  if (!id) {
    return '';
  }
  return resolveCustomEmojiApiUrl(id, config.proxyStars.customEmojiFetchBase);
});

const rootStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  minWidth: `${props.size}px`,
  minHeight: `${props.size}px`,
  lineHeight: `${props.size}px`,
}));

/** Пока нет URL — плейсхолдер только при непустом `documentId` без успешного резолва (пустой id); иначе до `load` / при ошибке скрываем поверх готового кадра. */
const showPlaceholder = computed(() => {
  if (!resolvedSrc.value) {
    return Boolean(props.documentId?.trim());
  }
  return !loaded.value && !loadFailed.value;
});

/** Внутрь TGS: при `loopLimit > 1` RLottie должен крутиться, пока сами не остановим по счётчику. */
const innerLoop = computed(() => {
  if (props.loopLimit != null && props.loopLimit > 1) {
    return true;
  }
  if (props.loopLimit === 1) {
    return false;
  }
  return props.loop;
});

watch(
  () => [props.src, props.documentId] as const,
  () => {
    loaded.value = false;
    loadFailed.value = false;
  },
);

function onLoad() {
  loaded.value = true;
  emit('load');
}

function onLoadError() {
  loadFailed.value = true;
}

function onAnimationEnd() {
  emit('animation-end');
}
</script>

<style scoped lang="scss">
.bm-custom-emoji {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.bm-custom-emoji__tgs {
  display: block;
  width: 100%;
  height: 100%;
}

.bm-custom-emoji__placeholder {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.25);
  pointer-events: none;
}
</style>

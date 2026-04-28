<template>
  <div class="custom-emoji-tgs" :style="rootStyle">
    <div
      v-show="error"
      class="custom-emoji-tgs__error text-caption text-negative q-pa-xs"
      role="alert"
    >
      {{ error }}
    </div>
    <div
      ref="hostRef"
      class="custom-emoji-tgs__host"
      :class="{ 'custom-emoji-tgs__host--hidden': !!error }"
      @mouseenter="onEnter"
      @mouseleave="onLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { ensureEmojiRlottie } from './EmojiRlottie.async';
import { generateUniqueId } from './utils';
import type EmojiRlottie from './EmojiRlottie';

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  loop: true,
  autoplay: true,
  playOnHover: false,
  quality: 1,
  isLowPriority: false,
  speed: 1,
  noPlay: false,
  shouldNotLoop: false,
  withSharedAnimation: false,
});

const emit = defineEmits<{
  load: [];
  error: [message: string];
  'animation-end': [];
}>();

const hostRef = ref<HTMLDivElement | null>(null);
const error = ref('');
let instance: EmojiRlottie | null = null;
const viewId = generateUniqueId();
const renderId = generateUniqueId();

/** RLottie `noLoop`: один проход или ручная остановка по `loopLimit`. */
const effectiveNoLoop = computed(() => {
  if (props.loopLimit != null && props.loopLimit > 0) {
    return props.loopLimit <= 1;
  }
  return props.shouldNotLoop || !props.loop;
});

const rootStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  minWidth: `${props.size}px`,
  minHeight: `${props.size}px`,
}));

let loopCount = 0;
let mountRequestId = 0;

function onLoopHandler() {
  if (props.loopLimit == null || props.loopLimit <= 0) {
    return;
  }
  loopCount += 1;
  if (loopCount >= props.loopLimit) {
    instance?.pause(viewId);
    emit('animation-end');
  }
}

function onEndedHandler() {
  emit('animation-end');
}

function onEnter() {
  if (props.playOnHover && instance && !props.noPlay) {
    instance.play(false, viewId);
  }
}

function onLeave() {
  if (props.playOnHover && instance) {
    instance.pause(viewId);
  }
}

const LAYOUT_ATTEMPTS_MAX = 72;
const TRANSIENT_MOUNT_ERROR_PATTERN = /not mounted/i;

async function mountSticker(url: string, layoutAttempt = 0) {
  const requestId = ++mountRequestId;
  error.value = '';
  const el = hostRef.value;
  if (!el || !url) {
    return;
  }

  let w = Math.max(el.getBoundingClientRect().width, el.offsetWidth);
  let h = Math.max(el.getBoundingClientRect().height, el.offsetHeight);
  /** Как в telegram-tt: размер стикера известен из пропса — не ждём layout flex-ячейки (Quasar `q-item-section side` часто даёт 0×0). */
  if (w < 1 && props.size > 0) {
    w = props.size;
  }
  if (h < 1 && props.size > 0) {
    h = props.size;
  }
  if ((w < 1 || h < 1) && layoutAttempt < LAYOUT_ATTEMPTS_MAX) {
    requestAnimationFrame(() => {
      void mountSticker(url, layoutAttempt + 1);
    });
    return;
  }

  instance?.removeView(viewId);
  instance = null;
  loopCount = 0;

  const noLoopVal = effectiveNoLoop.value;
  const useLoopCallback =
    props.loopLimit != null && props.loopLimit > 1 && !noLoopVal;

  try {
    const RLottie = await ensureEmojiRlottie();
    if (requestId !== mountRequestId) {
      return;
    }
    instance = RLottie.init(
      url,
      el,
      renderId,
      {
        size: props.size,
        noLoop: noLoopVal,
        quality: props.quality,
        isLowPriority: props.isLowPriority,
      },
      viewId,
      undefined,
      () => emit('load'),
      noLoopVal ? onEndedHandler : undefined,
      useLoopCallback ? onLoopHandler : undefined,
      undefined,
    );
    if (typeof props.speed === 'number' && props.speed !== 1) {
      instance.setSpeed(props.speed);
    }
    if (props.noPlay) {
      instance.pause(viewId);
    } else if (props.playOnHover) {
      instance.pause(viewId);
    } else if (props.autoplay) {
      instance.play(false, viewId);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (TRANSIENT_MOUNT_ERROR_PATTERN.test(message) && layoutAttempt < LAYOUT_ATTEMPTS_MAX) {
      requestAnimationFrame(() => {
        void mountSticker(url, layoutAttempt + 1);
      });
      return;
    }
    error.value = message;
    emit('error', message);
  }
}

onMounted(() => {
  void nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void mountSticker(props.src);
      });
    });
  });
});

watch(
  () =>
    [
      props.src,
      props.size,
      props.loop,
      props.quality,
      props.isLowPriority,
      props.shouldNotLoop,
      props.loopLimit,
    ] as const,
  ([url]) => {
    void mountSticker(url);
  },
  { flush: 'post' },
);

watch(
  () => effectiveNoLoop.value,
  (noLoop) => {
    if (instance) {
      instance.setNoLoop(noLoop);
    }
  },
);

watch(
  () => props.speed,
  (s) => {
    if (instance && typeof s === 'number') {
      instance.setSpeed(s);
    }
  },
);

watch(
  () => props.noPlay,
  (np) => {
    if (!instance) {
      return;
    }
    if (np) {
      instance.pause(viewId);
    } else if (!props.playOnHover && props.autoplay) {
      instance.play(false, viewId);
    }
  },
);

onBeforeUnmount(() => {
  mountRequestId += 1;
  instance?.removeView(viewId);
  instance = null;
});

interface Props {
  /** URL .tgs (например из `import url from '...tgs?url'`). */
  src: string;
  /** CSS-размер стороны в px. */
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  /** Если true — пауза по умолчанию, воспроизведение при наведении. */
  playOnHover?: boolean;
  /** Множитель к DPR (как в telegram-tt quality). */
  quality?: number;
  isLowPriority?: boolean;
  speed?: number;
  /** Не проигрывать (приоритетнее `autoplay` / hover). */
  noPlay?: boolean;
  /** Один проход без повтора (как `shouldNotLoop` в telegram-tt). */
  shouldNotLoop?: boolean;
  /** Число полных циклов; при `> 1` RLottie крутится до лимита, затем `animation-end`. */
  loopLimit?: number;
  /** Резерв под общий canvas (telegram-tt); пока без поведения. */
  withSharedAnimation?: boolean;
}
</script>

<style scoped lang="scss">
.custom-emoji-tgs {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.custom-emoji-tgs__host {
  width: 100%;
  height: 100%;
}

.custom-emoji-tgs__host--hidden {
  visibility: hidden;
  position: absolute;
  pointer-events: none;
}
</style>

<template>
  <div
    v-if="config.proxyStars.enabled"
    ref="starsRootRef"
    class="proxy-stars-root"
    :class="{ 'proxy-stars-root--reduced': reducedMotion }"
  >
    <div
      v-for="layer in layersData"
      :key="layer.id"
      class="proxy-stars-layer"
      :class="`proxy-stars-layer--${layer.kind}`"
      :style="layerMotionStyle(layer.kind)"
    >
      <div
        v-for="star in layer.stars"
        :key="star.id"
        class="proxy-stars-star"
        :style="starPositionStyle(star)"
      >
        <div
          class="proxy-stars-twinkle"
          :class="{ 'proxy-stars-twinkle--static': reducedMotion }"
          :style="twinkleStyle(star)"
        >
          <CustomEmoji
            :key="`${star.id}-${bootEpoch}`"
            loop
            autoplay
            is-low-priority
            class-name="proxy-stars-emoji"
            :quality="star.quality"
            :size="star.size"
            :speed="reducedMotion ? config.proxyStars.reducedEmojiSpeed : star.speed"
            :src="star.src"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import config from 'src/utils/config';
import type { ProxyStarsLayerKey } from 'src/utils/proxyStarsConfig';
import CustomEmoji from 'src/components/emoji/CustomEmoji.vue';

type LayerKind = ProxyStarsLayerKey;

type StarSpec = {
  id: string;
  src: string;
  xPct: number;
  yPct: number;
  size: number;
  quality: number;
  speed: number;
  twinkleDelay: number;
  twinkleDuration: number;
};

type LayerBlock = {
  id: string;
  kind: LayerKind;
  stars: StarSpec[];
};

const ps = config.proxyStars;

const layersData = ref<LayerBlock[]>([]);
const reducedMotion = ref(false);
const starsRootRef = ref<HTMLElement | null>(null);
/** Смена ключа заставляет заново смонтировать TGS (как при resize) — обходит «мёртвый» первый init rlottie до reflow. */
const bootEpoch = ref(0);

let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let layoutBumpTimer: ReturnType<typeof setTimeout> | undefined;
let mqReduce: MediaQueryList | null = null;
let mqMobile: MediaQueryList | null = null;
let visualViewportCleanup: (() => void) | undefined;
let starsLayoutObserver: ResizeObserver | null = null;
const STAR_SPAWN_Y_MIN_PCT = 100;
const STAR_SPAWN_Y_MAX_PCT = 200;

function bumpStickerMount() {
  bootEpoch.value += 1;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickSrc(): string {
  const list = ps.sources;
  if (list.length === 1) {
    return list[0]!;
  }
  const i = Math.floor(Math.random() * list.length);
  return list[i]!;
}

function readReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readProfile() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      lowEndHint: false,
    };
  }
  const w = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = w < ps.mobileBreakpoint;
  const lowEndHint = cores <= ps.lowEndConcurrencyMax || dpr >= ps.lowEndDprMin;
  return { isMobile, lowEndHint };
}

function makeStar(
  layerIndex: number,
  starIndex: number,
  kind: LayerKind,
  sizeMin: number,
  sizeMax: number,
  quality: number,
): StarSpec {
  const speed = randomBetween(ps.emojiSpeedMin, ps.emojiSpeedMax);
  return {
    id: `${kind}-${layerIndex}-${starIndex}-${Math.random().toString(36).slice(2, 9)}`,
    src: pickSrc(),
    xPct: randomBetween(2, 98),
    // Спавним в центральной зоне, чтобы начало цикла не выглядело как резкий "подъём с низа".
    yPct: randomBetween(STAR_SPAWN_Y_MIN_PCT, STAR_SPAWN_Y_MAX_PCT),
    size: Math.round(randomBetween(sizeMin, sizeMax)),
    quality,
    speed,
    twinkleDelay: randomBetween(0, ps.twinkleDelayMaxSec),
    twinkleDuration: randomBetween(ps.twinkleDurationMinSec, ps.twinkleDurationMaxSec),
  };
}

function layerMotionStyle(kind: LayerKind) {
  if (reducedMotion.value) {
    const r = ps.reducedMotionLayer;
    return {
      animationDuration: `${r.durationSec}s`,
      '--proxy-stars-drift': `${r.driftVh}vh`,
      opacity: r.opacity,
    };
  }
  const L = ps.layers[kind];
  return {
    animationDuration: `${L.durationSec}s`,
    '--proxy-stars-drift': `${L.driftVh}vh`,
    opacity: L.opacity,
  };
}

function buildLayers(): LayerBlock[] {
  if (!ps.enabled) {
    return [];
  }

  reducedMotion.value = readReducedMotion();
  const { isMobile, lowEndHint } = readProfile();

  if (reducedMotion.value) {
    const count = isMobile ? ps.reducedCountMobile : ps.reducedCountDesktop;
    const sizeMin = isMobile ? ps.sizeMobileMin : ps.sizeDesktopMin;
    const sizeMax = isMobile ? ps.sizeMobileMax : ps.sizeDesktopMax;
    const quality = isMobile ? ps.qualityReducedMobile : ps.qualityReducedDesktop;
    const stars: StarSpec[] = [];
    for (let i = 0; i < count; i += 1) {
      stars.push(makeStar(0, i, 'far', sizeMin, sizeMax, quality));
    }
    return [{ id: 'layer-far-reduced', kind: 'far', stars }];
  }

  const d = isMobile ? ps.densityMobile : ps.densityDesktop;
  let nearCount = d.near;
  let midCount = d.mid;
  let farCount = d.far;

  if (lowEndHint) {
    nearCount = Math.max(1, Math.round(nearCount * 0.75));
    midCount = Math.max(1, Math.round(midCount * 0.75));
    farCount = Math.max(1, Math.round(farCount * 0.75));
  }

  const sizeDesktopMax = lowEndHint ? ps.sizeDesktopMaxLowEnd : ps.sizeDesktopMax;
  const sizeDesktopMin = ps.sizeDesktopMin;
  const sizeMobileMin = ps.sizeMobileMin;
  const sizeMobileMax = lowEndHint ? ps.sizeMobileMaxLowEnd : ps.sizeMobileMax;

  const sizeMin = isMobile ? sizeMobileMin : sizeDesktopMin;
  const sizeMax = isMobile ? sizeMobileMax : sizeDesktopMax;

  const quality = isMobile
    ? lowEndHint
      ? ps.qualityMobileLowEnd
      : ps.qualityMobile
    : lowEndHint
      ? ps.qualityDesktopLowEnd
      : ps.qualityDesktop;

  const nearStars: StarSpec[] = [];
  const midStars: StarSpec[] = [];
  const farStars: StarSpec[] = [];

  for (let i = 0; i < nearCount; i += 1) {
    nearStars.push(makeStar(0, i, 'near', sizeMin, sizeMax, quality));
  }
  for (let i = 0; i < midCount; i += 1) {
    midStars.push(makeStar(1, i, 'mid', sizeMin, sizeMax, quality));
  }
  for (let i = 0; i < farCount; i += 1) {
    farStars.push(makeStar(2, i, 'far', sizeMin, sizeMax, quality));
  }

  return [
    { id: 'layer-far', kind: 'far', stars: farStars },
    { id: 'layer-mid', kind: 'mid', stars: midStars },
    { id: 'layer-near', kind: 'near', stars: nearStars },
  ];
}

function regenerate() {
  layersData.value = buildLayers();
}

function scheduleRegenerate() {
  if (typeof window === 'undefined') {
    return;
  }
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    regenerate();
  }, ps.resizeDebounceMs);
}

function onReducedMotionChange() {
  reducedMotion.value = readReducedMotion();
  regenerate();
}

function onResize() {
  scheduleRegenerate();
}

function onMobileBreakpointChange() {
  scheduleRegenerate();
}

/** После commit layout — пересоздаём только инстансы TGS, без пересчёта позиций. */
function scheduleLayoutRemount() {
  void nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bumpStickerMount();
      });
    });
  });
}

function starPositionStyle(star: StarSpec) {
  return {
    left: `${star.xPct}%`,
    top: `${star.yPct}%`,
  };
}

function twinkleStyle(star: StarSpec) {
  return {
    animationDelay: `${star.twinkleDelay}s`,
    animationDuration: `${star.twinkleDuration}s`,
  };
}

onMounted(() => {
  if (!ps.enabled) {
    return;
  }
  regenerate();
  scheduleLayoutRemount();
  if (typeof window === 'undefined') {
    return;
  }
  window.addEventListener('resize', onResize, { passive: true });
  mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  mqReduce.addEventListener('change', onReducedMotionChange);
  mqMobile = window.matchMedia(`(max-width: ${ps.mobileBreakpoint - 1}px)`);
  mqMobile.addEventListener('change', onMobileBreakpointChange);

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', onResize, { passive: true });
    visualViewportCleanup = () => {
      vv.removeEventListener('resize', onResize);
    };
  }

  window.addEventListener('orientationchange', onResize, { passive: true });

  void nextTick(() => {
    const el = starsRootRef.value;
    if (el && typeof ResizeObserver !== 'undefined') {
      starsLayoutObserver = new ResizeObserver(() => {
        const r = el.getBoundingClientRect();
        if (r.width > 8 && r.height > 8) {
          bumpStickerMount();
          starsLayoutObserver?.disconnect();
          starsLayoutObserver = null;
        }
      });
      starsLayoutObserver.observe(el);
    }
  });

  layoutBumpTimer = window.setTimeout(() => {
    bumpStickerMount();
  }, 450);
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    mqReduce?.removeEventListener('change', onReducedMotionChange);
    mqMobile?.removeEventListener('change', onMobileBreakpointChange);
    visualViewportCleanup?.();
    starsLayoutObserver?.disconnect();
    window.clearTimeout(resizeTimer);
    window.clearTimeout(layoutBumpTimer);
  }
  mqReduce = null;
  mqMobile = null;
  starsLayoutObserver = null;
  visualViewportCleanup = undefined;
});
</script>

<style scoped lang="scss">
.proxy-stars-root {
  inset: 0;
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.proxy-stars-layer {
  position: absolute;
  inset: 0;
  animation-name: proxyStarsDrift;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

.proxy-stars-star {
  position: absolute;
  transform: translate(-50%, -50%);
}

.proxy-stars-twinkle {
  animation-name: proxyStarsTwinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.proxy-stars-twinkle--static {
  animation: none;
  opacity: 0.55;
}

.proxy-stars-emoji {
  display: block;
  opacity: 0.92;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--q-primary) 25%, transparent));
}

@keyframes proxyStarsDrift {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(0, calc(var(--proxy-stars-drift) * -1), 0);
  }
}

@keyframes proxyStarsTwinkle {
  from {
    opacity: 0.38;
    transform: scale(0.94);
  }

  to {
    opacity: 1;
    transform: scale(1.02);
  }
}
</style>

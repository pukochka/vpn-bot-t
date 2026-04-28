<template>
  <q-card flat bordered class="transparent-style rounded relative-position overflow-hidden q-mb-sm">
    <q-list dense padding>
      <q-item :key="item.label" v-for="item of content">
        <q-item-section side>
          <CustomEmoji
            loop
            autoplay
            :size="48"
            :src="item.icon"
            :key="`${item.label}-${bootEpoch}`"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-left q-pt-xs text-body1 text-italic">
            {{ item.label }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>

  <buy-section></buy-section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import CustomEmoji from 'src/components/emoji/CustomEmoji.vue';
import BuySection from 'components/BuySection.vue';

const unlockUrl = new URL('../assets/Unlock.tgs', import.meta.url).href;
const diamondUrl = new URL('../assets/Question.tgs', import.meta.url).href;
const speedUrl = new URL('../assets/Speed.tgs', import.meta.url).href;
const defendUrl = new URL('../assets/Defend.tgs', import.meta.url).href;
const linkUrl = new URL('../assets/Earth.tgs', import.meta.url).href;

const buyCardRef = ref<HTMLElement | null>(null);
const bootEpoch = ref(0);
let remountTimer: ReturnType<typeof setTimeout> | undefined;
let layoutObserver: ResizeObserver | null = null;

const content = [
  { label: 'Безопасный серфинг', icon: linkUrl },
  { label: 'Анонимность', icon: diamondUrl },
  { label: 'Максимальная скорость', icon: speedUrl },
  { label: 'Защита в общественных сетях', icon: defendUrl },
  { label: '3 устройства для подключения', icon: unlockUrl },
];

function bumpStickerMount() {
  bootEpoch.value += 1;
}

function scheduleLayoutRemount() {
  void nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bumpStickerMount();
      });
    });
  });
}

onMounted(() => {
  scheduleLayoutRemount();

  remountTimer = window.setTimeout(() => {
    bumpStickerMount();
  }, 450);

  void nextTick(() => {
    const el = buyCardRef.value;
    if (el && typeof ResizeObserver !== 'undefined') {
      layoutObserver = new ResizeObserver(() => {
        const r = el.getBoundingClientRect();
        if (r.width > 8 && r.height > 8) {
          bumpStickerMount();
          layoutObserver?.disconnect();
          layoutObserver = null;
        }
      });
      layoutObserver.observe(el);
    }
  });
});

onBeforeUnmount(() => {
  layoutObserver?.disconnect();
  layoutObserver = null;
  window.clearTimeout(remountTimer);
});
</script>

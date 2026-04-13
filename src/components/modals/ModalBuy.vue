<template>
  <q-dialog persistent position="bottom" v-model="vpn.modals.buy">
    <q-card class="modal-rounded modal-responsive relative-position overflow-hidden">
      <modal-top :class="[searching ? 'z-max' : '']">Купить</modal-top>

      <q-card-section class="q-pt-none">
        <div class="rounded transparent-style q-card--bordered overflow-hidden">
          <div class="text-center text-caption q-py-sm">Выберите количество дней</div>

          <q-tabs inline-label align="justify" class="tab-rounded" v-model="vpn.selectedPeriod">
            <q-tab class="rounded" :key="key" :name="key" v-for="(period, key) of periods">
              <div class="text-h6 text-weight-bold">{{ period }}</div>
            </q-tab>
          </q-tabs>
        </div>

        <div class="total-card text-center q-my-md q-py-sm rounded brand transition overflow-hidden">
          <transition name="period-color-fade">
            <div
              :key="selectedPeriodColor"
              class="total-card__bg absolute-full"
              :class="['bg-gradient--' + selectedPeriodColor]"
            />
          </transition>

          <div class="total-card__content relative-position">
            <div class="text-caption">Итого</div>

            <div class="text-h5 text-weight-bold">
              <span class="price-roll" :class="['price-roll--' + priceDirection]">
                <span v-for="digit of rollingPriceDigits" :key="digit.key" class="price-roll__digit">
                  <span
                    class="price-roll__strip"
                    :class="{ 'price-roll__strip--static': !digit.changed }"
                    :style="{ transform: `translateY(-${digit.target}em)` }"
                  >
                    <span v-for="(value, index) of digitSequence" :key="index" class="price-roll__value">
                      {{ value }}
                    </span>
                  </span>
                </span>
                <span class="price-roll__currency">₽</span>
              </span>
            </div>
          </div>
        </div>
      </q-card-section>

      <modal-bottom no-top-space>
        <q-btn
          no-caps
          unelevated
          label="Купить"
          class="rounded col q-card--bordered"
          :loading="searching"
          :disable="searching"
          @click="buyPeriod"
        />
      </modal-bottom>

      <transition name="search-fade">
        <div v-if="searching" class="modal-buy-searching-overlay column flex-center">
          <div class="search-visual">
            <div class="search-orbit" aria-hidden="true">
              <span
                v-for="n in 8"
                :key="n"
                class="search-orbit-dot"
                :style="{ '--orbit-i': n - 1 }"
              />
            </div>
            <div class="search-core">
              <q-icon :name="mdiServerNetwork" size="34px" class="search-core-icon" />
            </div>
            <div class="search-pulse search-pulse--a" />
            <div class="search-pulse search-pulse--b" />
          </div>

          <transition name="phrase-slide" mode="out-in">
            <p :key="phraseIndex" class="search-phrase text-center q-px-md q-mt-lg">
              {{ phrases[phraseIndex] }}
            </p>
          </transition>
        </div>
      </transition>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { mdiServerNetwork } from '@quasar/extras/mdi-v7';

import { VpnService } from 'src/api/vpn';
import { periods } from 'stores/vpnModels';
import { useVpnStore } from 'stores/vpnStore';
import { alphabetColor } from 'src/utils/useColor';

import ModalTop from './sections/ModalTop.vue';
import ModalBottom from './sections/ModalBottom.vue';

const vpn = useVpnStore();

const searching = ref(false);

const phrases = [
  'Подбираем сервера, это может занять время',
  'Мы ищем лучшее для Вас',
  'Сопоставляем нагрузку и регион…',
  'Почти готово — оформляем доступ',
];

const phraseIndex = ref(0);
let phraseTimer: ReturnType<typeof setInterval> | null = null;
const digitSequence = Array.from({ length: 30 }, (_, index) => index % 10);

const startPhraseRotation = () => {
  phraseIndex.value = 0;
  phraseTimer = setInterval(() => {
    phraseIndex.value = (phraseIndex.value + 1) % phrases.length;
  }, 2600);
};

const stopPhraseRotation = () => {
  if (phraseTimer !== null) {
    clearInterval(phraseTimer);
    phraseTimer = null;
  }
};

onBeforeUnmount(() => {
  stopPhraseRotation();
});

const parsedPrices = computed<Record<string, string>>(() =>
  Object.fromEntries(vpn.prises.split(',').map((item) => item.split('-'))),
);

const price = computed(() => parsedPrices.value[vpn.selectedPeriod] ?? '0');
const selectedPeriodColor = computed(() => alphabetColor(vpn.selectedPeriod));

const priceNumber = computed(() => {
  const value = Number(price.value);

  return Number.isFinite(value) ? value : 0;
});

const previousPrice = ref(priceNumber.value);
const priceDirection = ref<'up' | 'down'>('up');

watch(priceNumber, (nextValue, previousValue) => {
  previousPrice.value = previousValue;
  priceDirection.value = nextValue >= previousValue ? 'up' : 'down';
});

const rollingPriceDigits = computed(() => {
  const currentDigits = String(priceNumber.value).split('').map(Number);
  const previousDigits = String(previousPrice.value).split('').map(Number);
  const digitCount = Math.max(1, currentDigits.length);

  return Array.from({ length: digitCount }, (_, index) => {
    const from = previousDigits[previousDigits.length - digitCount + index] ?? 0;
    const to = currentDigits[currentDigits.length - digitCount + index] ?? 0;
    const middleOffset = 10;

    const fromIndex = middleOffset + from;
    let target = middleOffset + to;

    if (priceDirection.value === 'up' && target < fromIndex) {
      target += 10;
    }

    if (priceDirection.value === 'down' && target > fromIndex) {
      target -= 10;
    }

    return {
      key: index,
      changed: from !== to,
      target,
    };
  });
});

const buyPeriod = async () => {
  try {
    searching.value = true;
    startPhraseRotation();

    const response = await VpnService.buy(vpn.userTgId, vpn.selectedPeriod, vpn.secretKey);

    vpn.selectedOrder = response.data.data;
    vpn.openModal('order');
  } catch {
  } finally {
    stopPhraseRotation();
    searching.value = false;
    vpn.closeModal('buy');
  }
};
</script>

<style scoped>
.total-card {
  position: relative;
}

.total-card__bg {
  z-index: 0;
}

.total-card__content {
  z-index: 1;
}

.period-color-fade-enter-active,
.period-color-fade-leave-active {
  transition: opacity 0.32s ease;
}

.period-color-fade-enter-from,
.period-color-fade-leave-to {
  opacity: 0;
}

.price-roll {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: 1.02ch;
  column-gap: 0;
  align-items: end;
  justify-items: center;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  line-height: 1;
}

.price-roll__digit {
  width: 1.02ch;
  height: 1em;
  overflow: hidden;
  text-align: center;
}

.price-roll__strip {
  display: flex;
  flex-direction: column;
  line-height: 1em;
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.price-roll__strip--static {
  transition-duration: 0ms;
}

.price-roll__value {
  display: block;
  width: 100%;
  height: 1em;
  line-height: 1em;
  text-align: center;
}

.price-roll__currency {
  width: auto;
  margin-left: 0.12em;
  line-height: 1;
  align-self: end;
}
</style>

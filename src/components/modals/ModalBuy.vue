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

        <div
          class="text-center q-my-md q-py-sm rounded brand transition"
          :class="['bg-gradient--' + alphabetColor(vpn.selectedPeriod)]"
        >
          <div class="text-caption">Итого</div>

          <div class="text-h5 text-weight-bold">{{ price }} ₽</div>
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
import { computed, onBeforeUnmount, ref } from 'vue';
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

const price = computed(
  () =>
    Object.fromEntries(vpn.prises.split(',').map((item) => item.split('-')))[vpn.selectedPeriod],
);

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

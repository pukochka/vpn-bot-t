<template>
  <q-layout view="lHr lpR lFr" class="overflow-hidden main-layout">
    <proxy-stars></proxy-stars>

    <transition name="q-transition--fade">
      <div
        v-if="!vpn.loading && !vpn.error"
        class="q-ma-sm row justify-between fixed-top z-marginals items-center rounded transparent-style q-card--bordered"
      >
        <q-btn
          v-if="isPaymentPage"
          flat
          class="rounded"
          icon="chevron_left"
          @click="goBackFromPayment"
        />
        <q-btn
          v-else-if="vpn.tab === 'orders'"
          flat
          class="rounded"
          icon="chevron_left"
          @click="vpn.tab = 'buy'"
        />

        <div class="text-center q-px-md q-py-sm">
          <div v-if="isPaymentPage" class="text-subtitle1 text-weight-medium">Оплата</div>
          <div v-else class="text-h5 text-weight-bold">High VPN</div>
        </div>

        <q-btn
          flat
          class="rounded"
          :icon="isDarkTheme ? 'light_mode' : 'dark_mode'"
          @click="toggleTheme"
        />
      </div>
    </transition>

    <div class="gradient-piece"></div>

    <div class="gradient-piece gradient-piece-top"></div>

    <transition name="q-transition--fade">
      <q-page-container v-if="!vpn.loading && !vpn.error">
        <router-view />
      </q-page-container>
    </transition>

    <transition name="q-transition--fade">
      <q-tabs
        v-if="!vpn.loading && !vpn.error && !isPaymentPage"
        dense
        no-caps
        content-class="row"
        active-class="text-primary"
        indicator-color="transparent"
        class="q-ma-sm q-card--bordered rounded transparent-style fixed-bottom z-marginals"
        v-model="vpn.tab"
      >
        <div class="col">
          <q-tab name="buy">
            <div class="column items-center">
              <CustomEmoji loop autoplay :size="32" :src="paymentUrl" :key="`buy-${tabEmojiRenderKey}`" />

              <div class="">Купить</div>
            </div>
          </q-tab>
        </div>

        <div class="col">
          <q-tab name="orders">
            <div class="column items-center">
              <CustomEmoji loop autoplay :size="32" :src="orderUrl" :key="`orders-${tabEmojiRenderKey}`" />

              <div class="">Заказы</div>
            </div>
          </q-tab>
        </div>

        <div class="col">
          <q-tab name="info">
            <div class="column items-center">
              <CustomEmoji loop autoplay :size="32" :src="infoUrl" :key="`info-${tabEmojiRenderKey}`" />

              <div class="">Инструкция</div>
            </div>
          </q-tab>
        </div>
      </q-tabs>
    </transition>
  </q-layout>

  <q-inner-loading
    transition-show="none"
    transition-hide="fade"
    :showing="vpn.loading || vpn.error"
  >
    <div class="text-h4" v-if="vpn.error">Ошибка...</div>

    <q-spinner v-else :thickness="1" size="120px" color="primary" />
  </q-inner-loading>

  <modal-order></modal-order>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LocalStorage, useQuasar } from 'quasar';
import { applyThemePrimaryFromConfig } from 'src/utils/config';
import { useVpnStore } from 'stores/vpnStore';

import ModalOrder from 'components/modals/ModalOrder.vue';
import ProxyStars from 'components/ProxyStars.vue';
import CustomEmoji from '../components/emoji/CustomEmoji.vue';

const orderUrl = new URL('../assets/Order.tgs', import.meta.url).href;
const paymentUrl = new URL('../assets/Payment.tgs', import.meta.url).href;
const infoUrl = new URL('../assets/InfoQuestion.tgs', import.meta.url).href;

const vpn = useVpnStore();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const THEME_STORAGE_KEY = 'isDarkTheme';

const isPaymentPage = computed(() => route.path.startsWith('/payment'));
const isDarkTheme = computed(() => $q.dark.isActive);
const tabEmojiRenderKey = ref(0);

const remountTabEmojis = () => {
  tabEmojiRenderKey.value += 1;
};

const scheduleTabEmojisRemount = () => {
  void nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        remountTabEmojis();
      });
    });
  });
};

const goBackFromPayment = async () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }

  await router.push('/');
};

const toggleTheme = () => {
  $q.dark.toggle();
  LocalStorage.set(THEME_STORAGE_KEY, $q.dark.isActive);
  applyThemePrimaryFromConfig();
};

onMounted(() => {
  const savedTheme = LocalStorage.getItem(THEME_STORAGE_KEY);
  if (typeof savedTheme === 'boolean') {
    $q.dark.set(savedTheme);
  }

  applyThemePrimaryFromConfig();
  scheduleTabEmojisRemount();
});

watch(
  () => !vpn.loading && !vpn.error && !isPaymentPage.value,
  (isTabBarVisible) => {
    if (isTabBarVisible) {
      scheduleTabEmojisRemount();
    }
  },
);
</script>

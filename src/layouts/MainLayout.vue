<template>
  <q-layout view="lHr lpR lFr" class="overflow-hidden">
    <transition name="q-transition--fade">
      <div
        v-if="!vpn.loading && !vpn.error"
        class="q-ma-sm row justify-between fixed-top z-marginals items-center rounded transparent-style q-card--bordered"
      >
        <div class="col">
          <q-btn
            v-if="vpn.tab === 'orders'"
            flat
            size="lg"
            class="rounded"
            icon="chevron_left"
            @click="vpn.tab = 'profile'"
          />
        </div>

        <div class="text-h6 text-weight-bold text-center q-pa-sm col text-no-wrap">
          {{ vpn.heading || 'VPN' }}
        </div>

        <div class="col row justify-end">
          <q-btn
            v-if="vpn.tab !== 'orders'"
            flat
            stack
            no-caps
            class="rounded"
            :icon="mdiFolderKeyOutline"
            @click="vpn.tab = 'orders'"
          >
            <div class="text-body2 text-weight-medium">Ключи</div>
          </q-btn>
        </div>
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
        v-if="!vpn.loading && !vpn.error"
        dense
        no-caps
        content-class="row"
        active-class="text-primary"
        indicator-color="transparent"
        class="q-ma-sm q-card--bordered rounded transparent-style fixed-bottom z-marginals"
        v-model="vpn.tab"
      >
        <div class="col">
          <q-tab name="buy" :icon="mdiCreditCardCheckOutline" label="Купить" />
        </div>

        <div class="col">
          <q-tab name="profile" :icon="mdiAccount" label="Профиль" />
        </div>

        <div class="col">
          <q-tab name="info" :icon="mdiInformation" label="Инструкция" />
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

  <modal-buy></modal-buy>

  <modal-free></modal-free>

  <modal-order></modal-order>
</template>

<script setup lang="ts">
import { useVpnStore } from 'stores/vpnStore';

import ModalBuy from 'components/modals/ModalBuy.vue';
import ModalOrder from 'components/modals/ModalOrder.vue';
import ModalFree from 'components/modals/ModalFree.vue';

import {
  mdiAccount,
  mdiCreditCardCheckOutline,
  mdiFolderKeyOutline,
  mdiInformation,
} from '@quasar/extras/mdi-v7';

const vpn = useVpnStore();
</script>

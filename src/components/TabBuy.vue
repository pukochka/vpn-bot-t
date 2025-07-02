<template>
  <q-item v-if="vpn.freeShow === 1" clickable class="vpn-card" @click="vpn.openModal('free')">
    <div class="absolute-full bg-gradient--green"></div>

    <q-item-section class="z-5">
      <q-item-label class="text-center text-h6 text-weight-bold"> Ваш бесплатный VPN </q-item-label>

      <q-item-label class="text-center">Выдача доступна каждый месяц</q-item-label>
    </q-item-section>
  </q-item>

  <q-item clickable class="vpn-card" @click="buyHalfYear">
    <div class="absolute-full bg-gradient--brand"></div>

    <q-item-section class="z-5">
      <q-item-label class="text-h6 text-weight-bold">Получить 180 Дней</q-item-label>

      <q-item-label class="text-center">Самый популярный выбор</q-item-label>
    </q-item-section>
  </q-item>

  <q-item clickable class="vpn-card" @click="vpn.openModal('buy')">
    <div class="absolute-full bg-gradient--primary"></div>

    <q-item-section class="z-5">
      <q-item-label class="text-h5 text-weight-bold">Купить</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useVpnStore } from 'stores/vpnStore';

const vpn = useVpnStore();

const buyHalfYear = () => {
  vpn.selectedPeriod = '6';
  vpn.openModal('buy');
};
</script>

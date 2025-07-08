<template>
  <q-item v-if="vpn.freeShow === 1" clickable class="vpn-card" @click="vpn.openModal('free')">
    <div class="absolute-full bg-gradient--green"></div>

    <q-item-section class="z-5">
      <q-item-label class="text-center text-h6 text-weight-bold"> Ваш бесплатный VPN </q-item-label>

      <q-item-label class="text-center">Выдача доступна каждый месяц</q-item-label>
    </q-item-section>
  </q-item>

  <q-item clickable class="vpn-card info q-my-sm" @click="buyHalfYear">
    <div class="absolute-full bg-gradient--brand"></div>

    <q-item-section class="z-5">
      <q-item-label class="row justify-center">
        <q-list dense>
          <q-item :key="item.label" v-for="item of content">
            <q-item-section side>
              <q-icon :name="item.icon" color="black" size="26px" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-center text-weight-bold q-pt-sm">
                {{ item.label }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-item-label>
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
import {
  mdiCrown,
  mdiIncognito,
  mdiShieldCheck,
  mdiSpeedometer,
  mdiVpn,
  mdiWifiLock,
} from '@quasar/extras/mdi-v7';

const vpn = useVpnStore();

const content = [
  { label: 'Лучший VPN', icon: mdiCrown },
  { label: 'Безопасный серфинг', icon: mdiShieldCheck },
  { label: 'Анонимность', icon: mdiIncognito },
  { label: 'Максимальная скорость', icon: mdiSpeedometer },
  { label: 'Обход блокировок', icon: mdiVpn },
  { label: 'Защита в общественных сетях', icon: mdiWifiLock },
];

const buyHalfYear = () => {
  vpn.selectedPeriod = '6';
  vpn.openModal('buy');
};
</script>

<template>
  <q-page class="padding-page">
    <q-tab-panels
      animated
      class="bg-transparent q-tab-grow q-pa-none"
      @before-transition="updatePanel"
      v-model="vpn.tab"
    >
      <q-tab-panel name="buy" class="q-pa-none overflow-hidden">
        <tab-buy></tab-buy>
      </q-tab-panel>

      <q-tab-panel name="orders" class="q-pa-none col column overflow-hidden">
        <tab-orders></tab-orders>
      </q-tab-panel>

      <q-tab-panel name="info" class="q-pa-none">
        <tab-info></tab-info>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { getAllOrders } from 'src/utils/ordersIndexedDb';
import { useVpnStore } from 'stores/vpnStore';

import TabBuy from 'components/TabBuy.vue';
import TabInfo from 'components/TabInfo.vue';
import TabOrders from 'components/TabOrders.vue';

const vpn = useVpnStore();

const loadLocalOrders = async () => {
  try {
    vpn.loadingOrders = true;
    const orders = await getAllOrders();

    vpn.setOrders(orders);
  } catch {
  } finally {
    vpn.loadingOrders = false;
  }
};

const updatePanel = async (nextTab?: string | number) => {
  const tab = nextTab || vpn.tab;

  if (tab !== 'orders' && tab !== 'profile') return;

  await loadLocalOrders();
};

onMounted(async () => {
  await loadLocalOrders();
});
</script>

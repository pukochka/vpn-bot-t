<template>
  <q-page class="padding-page column">
    <q-tab-panels
      animated
      class="bg-transparent bm-fit--container-content q-tab-grow"
      @before-transition="updatePanel"
      v-model="vpn.tab"
    >
      <q-tab-panel name="buy" class="q-pa-none col column justify-evenly overflow-hidden">
        <tab-buy></tab-buy>
      </q-tab-panel>

      <q-tab-panel name="profile" class="q-pa-none col column justify-evenly overflow-hidden">
        <tab-profile></tab-profile>
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
import { useVpnStore } from 'stores/vpnStore';
import TabBuy from 'components/TabBuy.vue';
import TabProfile from 'components/TabProfile.vue';
import TabInfo from 'components/TabInfo.vue';
import TabOrders from 'components/TabOrders.vue';
import { VpnService } from 'src/api/vpn';

const vpn = useVpnStore();

const updatePanel = async () => {
  if (vpn.tab !== 'profile' && vpn.orders.length) return;

  try {
    vpn.loadingOrders = true;

    const response = await VpnService.orders(vpn.user.user.telegram_id);

    vpn.orders = response.data.data.keys;
  } catch {
  } finally {
    vpn.loadingOrders = false;
  }
};
</script>

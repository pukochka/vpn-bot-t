<template>
  <q-dialog persistent position="bottom" v-model="vpn.modals.order">
    <q-card flat bordered class="modal-rounded modal-responsive">
      <modal-top>Детали заказа</modal-top>

      <q-card-section class="q-pt-none">
        <order-card :order="vpn.selectedOrder || defaultKey"></order-card>
      </q-card-section>

      <q-card-section class="q-pt-none row">
        <q-btn
          flat
          no-caps
          icon="launch"
          target="_blank"
          label="Перейти к конфигурации"
          class="col q-card--bordered rounded"
          :href="vpn.selectedOrder?.config_url"
        />
      </q-card-section>

      <modal-bottom no-top-space> </modal-bottom>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useVpnStore } from 'stores/vpnStore';
import { defaultKey } from 'stores/vpnModels';

import ModalTop from './sections/ModalTop.vue';
import ModalBottom from './sections/ModalBottom.vue';
import OrderCard from 'components/OrderCard.vue';

const vpn = useVpnStore();
</script>

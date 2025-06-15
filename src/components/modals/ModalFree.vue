<template>
  <q-dialog persistent position="bottom" v-model="vpn.modals.free">
    <q-card class="modal-rounded modal-responsive">
      <modal-top>Бесплатный ключ</modal-top>

      <q-card-section class="q-pt-none">
        <order-card :order="defaultKey"></order-card>
      </q-card-section>

      <modal-bottom no-top-space>
        <q-btn no-caps unelevated color="primary" class="rounded col" label="Купить" />
      </modal-bottom>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useVpnStore } from 'stores/vpnStore';

import ModalTop from './sections/ModalTop.vue';
import ModalBottom from './sections/ModalBottom.vue';
import OrderCard from 'components/OrderCard.vue';
import { defaultKey } from 'stores/vpnModels';

const vpn = useVpnStore();
</script>

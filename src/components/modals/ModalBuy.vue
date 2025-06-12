<template>
  <q-dialog persistent position="bottom" v-model="vpn.modals.buy">
    <q-card class="modal-rounded modal-responsive">
      <modal-top>Купить</modal-top>

      <q-card-section class="q-pt-none">
        <q-list class="rounded bm-list__style overflow-hidden">
          <q-item tag="label" clickable :key="key" v-for="(period, key) of periods">
            <q-item-section avatar>
              <q-radio v-model="vpn.selectedPeriod" :val="key" color="primary" />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ period }} Дней</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
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

const vpn = useVpnStore();

const periods = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};
</script>

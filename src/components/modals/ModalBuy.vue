<template>
  <q-dialog persistent position="bottom" v-model="vpn.modals.buy">
    <q-card class="modal-rounded modal-responsive">
      <modal-top>Купить</modal-top>

      <q-card-section class="q-pt-none">
        <div class="rounded bm-list__style overflow-hidden">
          <div class="text-center text-caption q-py-sm">Выберите количество дней</div>

          <q-tabs inline-label align="justify" class="tab-rounded" v-model="vpn.selectedPeriod">
            <q-tab
              class="rounded"
              :key="key"
              :name="key"
              :label="period"
              v-for="(period, key) of periods"
            />
          </q-tabs>
        </div>
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

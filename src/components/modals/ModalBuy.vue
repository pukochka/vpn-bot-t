<template>
  <q-dialog persistent position="bottom" v-model="vpn.modals.buy">
    <q-card class="modal-rounded modal-responsive">
      <modal-top>Купить</modal-top>

      <q-card-section class="q-pt-none">
        <div class="rounded transparent-style q-card--bordered overflow-hidden">
          <div class="text-center text-caption q-py-sm">Выберите количество дней</div>

          <q-tabs inline-label align="justify" class="tab-rounded" v-model="vpn.selectedPeriod">
            <q-tab class="rounded" :key="key" :name="key" v-for="(period, key) of periods">
              <div class="text-h6 text-weight-bold">{{ period }}</div>
            </q-tab>
          </q-tabs>
        </div>

        <div
          class="text-center q-my-md q-py-sm rounded brand transition"
          :class="['bg-gradient--' + alphabetColor(vpn.selectedPeriod)]"
        >
          <div class="text-caption">Итого</div>

          <div class="text-h5 text-weight-bold">{{ price }} ₽</div>
        </div>
      </q-card-section>

      <modal-bottom no-top-space>
        <q-btn
          no-caps
          unelevated
          label="Купить"
          class="rounded col q-card--bordered"
          :loading="loading"
          @click="buyPeriod"
        />
      </modal-bottom>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { VpnService } from 'src/api/vpn';
import { periods } from 'stores/vpnModels';
import { useVpnStore } from 'stores/vpnStore';
import { alphabetColor } from 'src/utils/useColor';

import ModalTop from './sections/ModalTop.vue';
import ModalBottom from './sections/ModalBottom.vue';

const vpn = useVpnStore();

const loading = ref(false);

const price = computed(
  () =>
    Object.fromEntries(vpn.prises.split(',').map((item) => item.split('-')))[vpn.selectedPeriod],
);

const buyPeriod = async () => {
  try {
    loading.value = true;

    const response = await VpnService.buy(vpn.userTgId, vpn.selectedPeriod, vpn.secretKey);

    vpn.selectedOrder = response.data.data;
    vpn.openModal('order');
  } catch {
  } finally {
    loading.value = false;
    vpn.closeModal('buy');
  }
};
</script>

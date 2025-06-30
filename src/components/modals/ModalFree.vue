<template>
  <q-dialog persistent position="bottom" @before-show="updateShow" v-model="vpn.modals.free">
    <q-card class="modal-rounded modal-responsive">
      <modal-top>Бесплатный ключ</modal-top>

      <div v-if="loading" class="q-py-xl"></div>

      <q-card-section class="q-pt-none" v-if="!loading">
        <div class="" v-if="error"></div>

        <order-card v-else :order="freeKey"></order-card>
      </q-card-section>

      <q-card-section class="q-pt-none row">
        <q-btn
          flat
          no-caps
          icon="launch"
          target="_blank"
          label="Перейти к конфигурации"
          class="col q-card--bordered rounded"
          :href="freeKey.config_url"
        />
      </q-card-section>

      <modal-bottom no-top-space> </modal-bottom>

      <q-inner-loading transition-show="none" transition-hide="fade" :showing="loading">
        <q-spinner :thickness="1" size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VpnService } from 'src/api/vpn';
import { defaultKey } from 'stores/vpnModels';
import { useVpnStore } from 'stores/vpnStore';

import ModalTop from './sections/ModalTop.vue';
import ModalBottom from './sections/ModalBottom.vue';
import OrderCard from 'components/OrderCard.vue';

const vpn = useVpnStore();

const error = ref(false);
const freeKey = ref(defaultKey);
const loading = ref(false);

const updateShow = async () => {
  try {
    loading.value = true;

    const response = await VpnService.free(vpn.user.user.telegram_id);
    freeKey.value = response.data.data;
  } catch {
    error.value = true;
    vpn.closeModal('free');
  } finally {
    loading.value = false;
  }
};
</script>

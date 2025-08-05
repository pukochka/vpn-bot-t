<template>
  <div class="rounded transparent-style q-card--bordered q-pa-sm">
    <div v-xss-html="vpn.instructions"></div>
  </div>

  <q-inner-loading transition-show="none" transition-hide="fade" :showing="loading">
    <q-spinner :thickness="3" size="64px" color="primary" />
  </q-inner-loading>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { VpnService } from 'src/api/vpn';
import { useVpnStore } from 'stores/vpnStore';
import { LocalStorage } from 'quasar';

const vpn = useVpnStore();

const loading = ref(false);

onMounted(async () => {
  vpn.instructions = LocalStorage.getItem('instructions') || {
    sections: [],
    success: true,
    support_text: '',
  };

  try {
    if (vpn.instructions.sections?.length === 0) {
      loading.value = true;
    }

    const response = await VpnService.instructions();

    vpn.instructions = (response.data?.data?.[0] || response.data || '')?.replace(/\n/gi, '<br>');

    LocalStorage.set('instructions', vpn.instructions);
  } finally {
    loading.value = false;
  }
});
</script>

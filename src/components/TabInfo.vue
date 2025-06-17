<template>
  <div class="rounded transparent-style q-pa-sm">
    <div class="q-py-md" v-for="(section, index) of vpn.instructions.sections" :key="index">
      <div class="text-h6 text-center">{{ section.title }}</div>

      <div class="" v-for="(nested, idx) of section.steps || section.links || []" :key="idx">
        <q-btn
          v-if="typeof nested === 'object'"
          flat
          no-caps
          padding="2px 8px"
          target="_blank"
          class="col-12 rounded"
          :href="(nested as Link).url"
        >
          <div class="row full-width justify-between items-center">
            <span>{{ idx + 1 }}. </span>
            <span v-html="(nested as Link).title"></span>

            <q-icon name="launch" size="22px" />
          </div>
        </q-btn>

        <div v-else>
          <span>{{ idx + 1 }}. </span>
          <span v-html="nested"></span>
        </div>
      </div>
    </div>

    <p class="text-body1 q-pt-md">{{ vpn.instructions.support_text }}</p>
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

    vpn.instructions = response.data.data.structured;

    LocalStorage.set('instructions', vpn.instructions);
  } finally {
    loading.value = false;
  }
});

interface Link {
  url: string;
  title: string;
}
</script>

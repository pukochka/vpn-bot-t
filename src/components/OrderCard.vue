<template>
  <q-list bordered separator class="rounded overflow-hidden">
    <q-item class="q-pa-none" v-for="(col, index) of columns" :key="index">
      <q-item-section class="col-4 q-px-md bm-list__style">{{ col.label }}</q-item-section>

      <q-separator vertical />

      <q-item-section class="col-8">
        <div class="q-pa-sm row items-center no-wrap">
          <div style="word-break: break-all" class="q-pr-lg ellipsis-3-lines">
            {{ col.value }}
          </div>

          <copy-button
            flat
            dense
            size="12px"
            :text="col.value?.toString()"
            v-if="col?.copy"
          ></copy-button>

          <q-btn
            flat
            dense
            size="12px"
            icon="launch"
            target="_blank"
            :href="col.value"
            v-if="col?.link"
          />
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { defaultKey, months } from 'stores/vpnModels';

import CopyButton from './modals/sections/CopyButton.vue';
import { date } from 'quasar';

const props = withDefaults(defineProps<Props>(), {
  order: () => defaultKey,
});

const finish = computed(() => Number(props.order.finish_at) * 1000);

const columns = computed(() => [
  {
    label: 'Ключ',
    value: props.order.key,
    copy: true,
  },
  {
    label: 'URL конфигурации для VPN',
    value: props.order.config_url,
    copy: true,
    link: true,
  },
  {
    label: 'Лимит трафика',
    value: props.order.traffic_limit_gb + ' Гб',
  },
  {
    label: 'Дата окончания действия ключа',
    value: date.formatDate(
      finish.value,
      'DD ' + months[new Date(finish.value).getMonth()] + ' YYYY',
    ),
  },
  {
    label: 'Статус ключа',
    value: props.order.status_text,
  },
]);

interface Props {
  order: VpnKey;
}
</script>

<template>
  <q-list class="q-gutter-y-sm">
    <q-item class="bm-list__style rounded overflow-hidden" v-for="item in 10" :key="item">
      <q-item-section>
        <div class="bordered rounded">
          <q-item class="q-pa-none" v-for="(col, index) of columns" :key="index">
            <q-item-section class="col-4 q-px-md">{{ col.label }}</q-item-section>

            <q-separator vertical />

            <q-item-section class="col-8">
              <div class="q-pa-sm row items-center no-wrap">
                <div style="word-break: break-all" class="q-pr-lg ellipsis-3-lines">
                  {{ col.value }}
                </div>
              </div>
            </q-item-section>
          </q-item>
        </div>

        <div class="row q-pt-sm">
          <q-btn flat no-caps class="rounded col" label="Конфигурация" />

          <q-btn flat no-caps class="rounded col" label="Детали" @click="openDetails" />
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVpnStore } from 'stores/vpnStore';

const vpn = useVpnStore();

const columns = computed(() => [
  {
    label: 'Лимит трафика',
    value: vpn.selectedOrder?.traffic_limit_gb + ' Gb',
  },
  {
    label: 'Дата окончания',
    value: vpn.selectedOrder?.finish_at,
  },

  {
    label: 'Статус ключа',
    value: vpn.selectedOrder?.status,
  },
]);

const openDetails = () => {
  vpn.openModal('order');
};
</script>

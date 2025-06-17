<template>
  <div class="text-h6 q-pa-md">Ваши ключи</div>

  <q-tabs
    dense
    no-caps
    align="justify"
    content-class="row"
    class="rounded transparent-style"
    v-model="filter"
  >
    <div class="col">
      <q-tab name="-" label="Все" />
    </div>
    <div class="col">
      <q-tab name="0" label="Активные" />
    </div>
    <div class="col">
      <q-tab name="1" label="Просроченные" />
    </div>
  </q-tabs>

  <q-list class="q-gutter-y-sm q-pt-md col">
    <div
      class="transparent-style rounded overflow-hidden row items-stretch"
      :key="order.key"
      v-for="order in filtered"
    >
      <div class="col-grow">
        <q-item>
          <q-item-section>
            <q-item-label>{{ finish(order) }}</q-item-label>

            <q-item-label caption>Дата окончания</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section v-for="(col, index) of columns" :key="index">
            <q-item-label>{{ col.value(order) }}</q-item-label>

            <q-item-label caption>{{ col.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </div>

      <q-btn flat no-caps class="rounded" icon="more_vert" @click="openDetails(order)" />
    </div>
  </q-list>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useVpnStore } from 'stores/vpnStore';
import { date } from 'quasar';
import { months } from 'stores/vpnModels';

const vpn = useVpnStore();

const filter = ref('-');

const filtered = computed(() => vpn.orders.filter((order) => order.status !== filter.value));

const finish = (order: VpnKey) =>
  date.formatDate(
    Number(order.finish_at) * 1000,
    'DD ' + months[new Date(Number(order.finish_at) * 1000).getMonth()] + ' YYYY',
  );

const columns = computed(() => [
  {
    label: 'Лимит трафика',
    value: (order: VpnKey) => order.traffic_limit_gb + ' Гб',
  },
  {
    label: 'Статус ключа',
    value: (order: VpnKey) => order.status_text,
  },
]);

const openDetails = (order: VpnKey) => {
  vpn.selectedOrder = order;
  vpn.openModal('order');
};
</script>

<template>
  <div class="text-h6 q-pa-md">Ваши ключи</div>

  <q-tabs
    dense
    no-caps
    align="justify"
    content-class="row"
    class="rounded transparent-style q-card--bordered"
    @update:model-value="vpn.page = 1"
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

  <q-list class="q-gutter-y-sm q-pt-md">
    <div
      class="transparent-style q-card--bordered rounded overflow-hidden row items-stretch"
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

    <div class="row rounded items-center transparent-style q-card--bordered overflow-hidden">
      <q-btn flat square class="col" icon="chevron_left" @click="prev" />

      <q-btn flat square no-caps class="col">
        <div class="text-body1 text-weight-bold">{{ vpn.page }} из {{ pages }}</div>

        <q-menu cover class="q-pa-md no-shadow rounded transparent-style q-card--bordered">
          <q-input dense v-model="search" label="Введите номер страницы">
            <template #append>
              <q-btn
                flat
                round
                dense
                v-close-popup
                icon="check"
                color="primary"
                @click="searchPage"
              />
            </template>
          </q-input>
        </q-menu>
      </q-btn>

      <q-btn flat square class="col" icon="chevron_right" @click="next" />
    </div>
  </q-list>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useVpnStore } from 'stores/vpnStore';
import { date } from 'quasar';
import { months } from 'stores/vpnModels';

const vpn = useVpnStore();

const search = ref('');
const filter = ref<'-' | '0' | '1'>('-');

const filterPages = computed(
  (): Record<'-' | '0' | '1', number> => ({
    '-': vpn.total,
    '0': vpn.totalActive,
    '1': vpn.totalDisable,
  }),
);

const pages = computed(() => Math.ceil(filterPages.value[filter.value] / vpn.limit));

const filtered = computed(() =>
  vpn.orders.filter(
    (order, index) =>
      index < vpn.limit * vpn.page &&
      index >= vpn.limit * (vpn.page - 1) &&
      order.status !== filter.value &&
      (filter.value === '0' ? Date.now() < Number(order.finish_at) * 1000 : true),
  ),
);

const finish = (order: VpnKey) =>
  date.formatDate(
    Number(order.finish_at) * 1000,
    'DD ' + months[new Date(Number(order.finish_at) * 1000).getMonth()] + ' YYYY',
  );

const columns = computed(() => [
  {
    label: 'Лимит трафика',
    value: (order: VpnKey) => (order.traffic_limit_gb < 500 ? order.traffic_limit_gb : '∞') + ' Гб',
  },
  {
    label: 'Статус ключа',
    value: (order: VpnKey) => order.status_text,
  },
]);

const searchPage = () => {
  const value = Number(search.value);

  if (value > pages.value || value < 1) return;

  vpn.page = value;
  search.value = '';
};

const prev = () => {
  if (vpn.page === 1) return;

  vpn.page--;
};

const next = () => {
  if (vpn.page === pages.value) return;

  vpn.page++;
};

const openDetails = (order: VpnKey) => {
  vpn.selectedOrder = order;
  vpn.openModal('order');
};
</script>

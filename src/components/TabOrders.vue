<template>
  <div class="text-h6 q-pa-md">Ваши ключи</div>
  <q-banner
    rounded
    inline-actions
    class="q-mx-md q-mb-sm rounded transparent-style q-card--bordered text-body2"
  >
    Заказы хранятся только локально в этом браузере и не переносятся на другие устройства.
  </q-banner>

  <q-tabs
    v-if="vpn.orders.length"
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

      <q-btn
        v-if="isAwaitingPayment(order)"
        flat
        no-caps
        class="rounded"
        icon="close"
        color="negative"
        :loading="cancellingOrderKey === order.key"
        :disable="cancellingOrderKey !== null"
        @click="cancelOrder(order)"
      />
      <q-btn
        flat
        no-caps
        class="rounded"
        icon="more_vert"
        :disable="cancellingOrderKey !== null"
        @click="openDetails(order)"
      />
    </div>

    <div
      v-if="vpn.orders.length"
      class="row rounded items-center transparent-style q-card--bordered overflow-hidden"
    >
      <q-btn flat square class="col" icon="chevron_left" @click="prev" />

      <q-btn flat square no-caps class="col">
        <div class="text-body1 text-weight-bold">{{ vpn.page }} из {{ pages }}</div>

        <q-menu cover class="q-pa-md no-shadow rounded transparent-style q-card--bordered">
          <q-input dense v-model="search" label="Введите номер страницы">
            <template #append>
              <q-btn flat round dense v-close-popup icon="check" @click="searchPage" />
            </template>
          </q-input>
        </q-menu>
      </q-btn>

      <q-btn flat square class="col" icon="chevron_right" @click="next" />
    </div>

    <div class="text-center text-h6 text-weight-bold" v-else>
      У Вас пока нет купленных ключей...
    </div>
  </q-list>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useVpnStore } from 'stores/vpnStore';
import { date } from 'quasar';
import { months } from 'stores/vpnModels';
import {
  PaymentOrderService,
  savePaymentOrderContext,
  type PaymentOrderStatusData,
} from 'src/api/paymentOrder';
import config, { getBotIdNumber } from 'src/utils/config';
import { upsertOrder } from 'src/utils/ordersIndexedDb';
import { useDialog } from 'src/utils/useDialog';

const vpn = useVpnStore();
const router = useRouter();

const search = ref('');
const filter = ref<'-' | '0' | '1'>('-');
const cancellingOrderKey = ref<string | null>(null);

const filterPages = computed(
  (): Record<'-' | '0' | '1', number> => ({
    '-': vpn.total,
    '0': vpn.totalActive,
    '1': vpn.totalDisable,
  }),
);

const pages = computed(() => Math.ceil(filterPages.value[filter.value] / 5));

const filtered = computed(() =>
  vpn.orders
    .filter((order) => order.status !== Number(filter.value))
    .filter((_, index) => index < 5 * vpn.page && index >= 5 * (vpn.page - 1)),
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

const isAwaitingPayment = (order: VpnKey): boolean => {
  const statusText = String(order.status_text || '')
    .trim()
    .toLowerCase();
  if (statusText.includes('ожидает оплат')) return true;
  if (statusText.includes('awaiting payment')) return true;
  if (statusText.includes('pending payment')) return true;
  if (String(order.payment_status || '').trim().toLowerCase() === 'wait') return true;

  return false;
};

const resolvePaymentOrderId = (order: VpnKey): string | null => {
  const normalizeOrderId = (raw: unknown): string | null => {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (/^o-\d+$/i.test(trimmed)) return `o-${trimmed.replace(/^o-/i, '')}`;
      if (/^\d+$/.test(trimmed)) return `o-${trimmed}`;
    }
    if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) {
      return `o-${raw}`;
    }
    return null;
  };

  return (
    normalizeOrderId(order.order_id) ||
    normalizeOrderId(order.id) ||
    normalizeOrderId(order.key) ||
    null
  );
};

const parseNumberOrNull = (value: unknown): number | null => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : NaN;

  return Number.isFinite(parsed) ? parsed : null;
};

const buildCancelledOrder = (
  order: VpnKey,
  statusData?: PaymentOrderStatusData | null,
): VpnKey => {
  const statusNumber = parseNumberOrNull(statusData?.status);
  const statusText =
    typeof statusData?.status_text === 'string' && statusData.status_text.trim()
      ? statusData.status_text.trim()
      : 'Отменен';
  const paymentStatus =
    typeof statusData?.payment_status === 'string' && statusData.payment_status.trim()
      ? statusData.payment_status.trim()
      : 'cancelled';
  const nextConfigUrl =
    typeof statusData?.config_url === 'string' && statusData.config_url.trim()
      ? statusData.config_url.trim()
      : order.config_url;
  const finishAt = parseNumberOrNull(statusData?.finish_at);
  const activatedAt = parseNumberOrNull(statusData?.activated_at);
  const trafficLimit = parseNumberOrNull(statusData?.traffic_limit);
  const trafficLimitGb = parseNumberOrNull(statusData?.traffic_limit_gb);

  return {
    ...order,
    status: statusNumber !== null ? Math.floor(statusNumber) : 0,
    status_text: statusText,
    payment_status: paymentStatus,
    config_url: nextConfigUrl,
    ...(finishAt !== null ? { finish_at: String(Math.floor(finishAt)) } : {}),
    ...(activatedAt !== null ? { activated_at: String(Math.floor(activatedAt)) } : {}),
    ...(trafficLimit !== null ? { traffic_limit: Math.floor(trafficLimit) } : {}),
    ...(trafficLimitGb !== null ? { traffic_limit_gb: trafficLimitGb } : {}),
  };
};

const openDetails = async (order: VpnKey) => {
  if (isAwaitingPayment(order)) {
    const orderId = resolvePaymentOrderId(order);
    if (!orderId) {
      useDialog('Не удалось определить ID заказа');
      return;
    }

    const botId = getBotIdNumber() || Number(config.bot_id);
    if (!botId) {
      useDialog('Не удалось определить bot_id');
      return;
    }

    try {
      const statusResponse = await PaymentOrderService.getStatus({
        bot_id: botId,
        order_id: orderId,
      });
      if (!statusResponse.result) {
        useDialog(statusResponse.message || 'Не удалось открыть страницу оплаты');
        return;
      }
    } catch (error) {
      useDialog(error instanceof Error ? error.message : 'Не удалось открыть страницу оплаты');
      return;
    }

    await savePaymentOrderContext({
      bot_id: botId,
      order_id: orderId,
    });

    await router.push({
      path: '/payment',
      query: {
        bot_id: String(botId || config.bot_id),
        order_id: orderId,
      },
    });
    return;
  }

  vpn.selectedOrder = order;
  vpn.openModal('order');
};

const cancelOrder = async (order: VpnKey) => {
  const orderId = resolvePaymentOrderId(order);
  if (!orderId) {
    useDialog('Не удалось определить ID заказа для отмены');
    return;
  }

  const botId = getBotIdNumber() || Number(config.bot_id);
  if (!botId) {
    useDialog('Не удалось определить bot_id для отмены заказа');
    return;
  }

  try {
    cancellingOrderKey.value = order.key;

    const response = await PaymentOrderService.cancel({
      bot_id: botId,
      order_id: orderId,
    });

    if (!response.result) {
      throw new Error(response.message || 'Не удалось отменить заказ');
    }

    const updatedOrder = buildCancelledOrder(order, response.data);
    await upsertOrder(updatedOrder);
    vpn.addOrder(updatedOrder);
    useDialog('Заказ отменен');
  } catch (error) {
    useDialog(error instanceof Error ? error.message : 'Ошибка отмены заказа');
  } finally {
    cancellingOrderKey.value = null;
  }
};
</script>

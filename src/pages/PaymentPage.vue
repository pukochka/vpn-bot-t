<template>
  <q-page
    :class="['padding-page column payment-shell', { 'payment-shell--dark': $q.dark.isActive }]"
  >
    <div class="payment-page col column q-py-lg">
      <q-card flat bordered class="rounded q-pa-lg q-mb-md payment-hero">
        <div class="row items-center justify-between">
          <div class="row no-wrap text-h4 text-weight-bold payment-muted">
            Заказ {{ orderId || '—' }}
          </div>

          <div class="payment-status rounded" :class="{ 'payment-status--paid': paid }">
            {{ paid ? 'Оплата подтверждена' : 'Ожидаем подтверждение оплаты' }}
          </div>
        </div>

        <div class="row items-end justify-between q-pt-sm">
          <div class="payment-amount-chip">
            <div class="text-h6 payment-muted">Сумма</div>
            <div class="text-h6 text-weight-bold">{{ amountText || '—' }}</div>
          </div>

          <q-btn
            v-if="!paid"
            flat
            no-caps
            label="Отменить заказ"
            class="rounded payment-btn payment-btn--ghost"
            :loading="cancelSubmitting"
            :disable="isAnyActionPending"
            @click="cancelFlow"
          />
        </div>
      </q-card>

      <q-banner v-if="errorMessage" rounded inline-actions class="rounded q-mb-md payment-alert">
        {{ errorMessage }}
      </q-banner>

      <q-card flat bordered v-if="paid" class="rounded q-pa-lg payment-block">
        <div class="text-h6 text-weight-bold q-mb-sm">Заказ успешно оплачен</div>

        <div class="text-body2 payment-muted q-mb-md">Можно вернуться на главный экран.</div>

        <q-btn
          no-caps
          unelevated
          class="rounded payment-btn payment-btn--primary"
          label="На главную"
          @click="goHomeToOrders"
        />
      </q-card>

      <template v-else>
        <q-card flat bordered class="rounded q-pa-lg q-mb-md payment-block">
          <div class="payment-step-title">
            Для сохранения заказа не только в приложении, введите Email
          </div>

          <q-card flat bordered class="rounded overflow-hidden transparent-style q-mt-sm">
            <q-input dense class="q-px-md" label="Email" v-model="email"></q-input>
          </q-card>
        </q-card>

        <q-card flat bordered class="rounded q-pa-lg q-mb-md payment-block">
          <div class="payment-step-title">Шаг 1. Выберите группу оплаты</div>

          <div class="row q-col-gutter-sm q-mt-sm">
            <div v-for="group in groups" :key="group.id" class="col-12 col-sm-6">
              <q-btn
                no-caps
                unelevated
                class="rounded full-width payment-choice"
                :class="{ 'payment-choice--active': selectedGroupId === group.id }"
                :loading="selectingGroupId === group.id"
                :disable="isSelectionLocked"
                :label="group.title || group.name || `Группа ${group.id}`"
                @click="selectGroup(group.id)"
              />
            </div>
          </div>
        </q-card>

        <q-card v-if="items.length" flat bordered class="rounded q-pa-lg q-mb-md payment-block">
          <div class="payment-step-title">Шаг 2. Выберите способ оплаты</div>
          <div class="column q-gutter-sm q-mt-sm">
            <q-card
              v-for="item in items"
              :key="item.id"
              flat
              bordered
              class="rounded q-pa-md payment-method"
              :class="{
                'payment-method--active': selectedItemId === item.id,
                'payment-method--disabled': isSelectionLocked,
              }"
              @click="selectItem(item.id)"
            >
              <div class="row items-center justify-between q-col-gutter-sm">
                <div class="col">
                  <div class="text-body1 text-weight-bold">
                    {{ item.design?.title || item.title || `Способ #${item.id}` }}
                  </div>
                  <div class="text-caption q-mt-xs payment-muted" v-if="item.design?.description">
                    {{ item.design.description }}
                  </div>
                </div>
                <div class="col-auto">
                  <q-spinner v-if="selectingItemId === item.id" color="primary" size="20px" />
                  <q-icon
                    v-else
                    :name="selectedItemId === item.id ? 'check_circle' : 'chevron_right'"
                    :class="selectedItemId === item.id ? 'text-positive' : 'payment-muted'"
                    size="20px"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </q-card>

        <q-card v-if="payData" flat bordered class="rounded q-pa-lg q-mb-md payment-block">
          <div class="payment-step-title">Шаг 3. Подтверждение оплаты</div>
          <div v-if="payData.dataPay?.text" class="text-body2 q-mt-sm payment-muted">
            {{ payData.dataPay.text }}
          </div>

          <q-input
            v-if="payData.dataPay?.type === 2"
            outlined
            dense
            v-model="payInputValue"
            :label="payData.dataPay?.label_input || 'Введите значение'"
            class="q-mt-md"
            input-class="payment-input-text"
          />

          <q-banner v-if="requiresTelegram" rounded class="rounded q-mt-md payment-alert">
            Этот способ оплаты нужно завершить во встроенном браузере.
          </q-banner>

          <div class="row q-col-gutter-sm q-mt-md">
            <div
              class="col-12 col-sm-auto"
              v-if="payData.dataPay?.type === 1 && payData.dataPay.link"
            >
              <q-btn
                no-caps
                unelevated
                class="rounded full-width payment-btn payment-btn--primary"
                :disable="isAnyActionPending"
                :label="payData.item?.design?.text_button || 'Перейти к оплате'"
                @click="openPaymentInCustomBrowser(payData.dataPay.link)"
              />
            </div>

            <div
              class="col-12 col-sm-auto"
              v-if="payData.dataPay?.type === 6 && payData.dataPay.web_app"
            >
              <q-btn
                no-caps
                unelevated
                class="rounded full-width payment-btn payment-btn--primary"
                :disable="isAnyActionPending"
                label="Открыть оплату"
                @click="openPaymentInCustomBrowser(payData.dataPay.web_app)"
              />
            </div>

            <div class="col-12 col-sm-auto" v-if="payData.dataPay?.type === 2">
              <q-btn
                no-caps
                unelevated
                class="rounded full-width payment-btn payment-btn--primary"
                :loading="paySubmitting"
                :disable="isAnyActionPending || !payInputValue.trim()"
                label="Продолжить"
                @click="submitPayInput"
              />
            </div>

            <div class="col-12 col-sm-auto" v-if="showCheckButton">
              <q-btn
                no-caps
                unelevated
                class="rounded full-width payment-btn payment-btn--secondary"
                :loading="checkSubmitting"
                :disable="isAnyActionPending"
                :label="payData.button_check_pay || 'Проверить оплату'"
                @click="checkPayment"
              />
            </div>

            <div class="col-12 col-sm-auto">
              <q-btn
                no-caps
                flat
                class="rounded full-width payment-btn payment-btn--ghost"
                :loading="cancelSubmitting"
                :disable="isAnyActionPending"
                :label="payData.button_cancel_pay || 'Отмена'"
                @click="cancelFlow"
              />
            </div>
          </div>

          <div v-if="payData.dataPay?.next_action_hint" class="text-caption q-mt-md payment-muted">
            {{ payData.dataPay.next_action_hint }}
          </div>
        </q-card>
      </template>
    </div>

    <q-dialog
      v-model="customBrowserOpen"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="column no-wrap">
        <q-bar class="q-px-md">
          <div class="text-subtitle2">Оплата</div>
          <q-space />
          <q-btn dense flat icon="close" @click="closeCustomBrowser" />
        </q-bar>

        <q-linear-progress v-if="customBrowserLoading" indeterminate color="primary" />

        <q-card-section class="col q-pa-none">
          <iframe
            v-if="customBrowserUrl"
            :src="customBrowserUrl"
            class="payment-browser-frame"
            title="Payment browser"
            @load="customBrowserLoading = false"
            @error="handleCustomBrowserFrameError"
          />
          <div v-else class="column flex-center full-height q-pa-lg text-center payment-muted">
            Ссылка для оплаты не найдена.
          </div>
        </q-card-section>

        <q-card-actions align="between" class="q-px-md q-py-sm">
          <div class="text-caption payment-muted ellipsis">
            {{ customBrowserUrl }}
          </div>
          <q-btn
            no-caps
            flat
            class="rounded payment-btn payment-btn--ghost"
            label="Открыть во внешнем браузере"
            :disable="!customBrowserUrl"
            @click="openPaymentInExternalBrowser(customBrowserUrl)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  PaymentOrderService,
  clearStoredPaymentOrderContext,
  getStoredPaymentOrderContext,
  savePaymentOrderContext,
  type PaymentGroup,
  type PaymentItem,
  type PaymentOrderStatusData,
  type PaymentPayData,
  type StoredPaymentOrderContext,
} from 'src/api/paymentOrder';
import config, { getBotIdNumber } from 'src/utils/config';
import { useDialog } from 'src/utils/useDialog';
import { getAllOrders, upsertOrder } from 'src/utils/ordersIndexedDb';
import { useVpnStore } from 'stores/vpnStore';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const vpn = useVpnStore();

const initialLoading = ref(false);
const paid = ref(false);
const errorMessage = ref('');
const amount = ref<number | null>(null);
const storedOrderContext = ref<StoredPaymentOrderContext | null>(null);
const fallbackOrderId = ref('');

const groups = ref<Array<PaymentGroup>>([]);
const items = ref<Array<PaymentItem>>([]);
const payData = ref<PaymentPayData | null>(null);

const email = ref('');
const selectedGroupId = ref<number | null>(null);
const selectedItemId = ref<number | null>(null);
const payInputValue = ref('');
const selectingGroupId = ref<number | null>(null);
const selectingItemId = ref<number | null>(null);
const paySubmitting = ref(false);
const checkSubmitting = ref(false);
const cancelSubmitting = ref(false);
const lastAutoOpenedItemId = ref<number | null>(null);
const customBrowserOpen = ref(false);
const customBrowserUrl = ref('');
const customBrowserLoading = ref(false);

let pollTimer: ReturnType<typeof setInterval> | null = null;

const getQueryString = (value: unknown): string => {
  if (Array.isArray(value)) {
    return getQueryString(value[0]);
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

const normalizeOrderId = (value: unknown): string => {
  const rawValue = getQueryString(value).trim();
  if (!rawValue) return '';
  if (/^o-\d+$/i.test(rawValue)) {
    return `o-${rawValue.replace(/^o-/i, '')}`;
  }
  if (/^\d+$/.test(rawValue)) {
    return `o-${rawValue}`;
  }
  return '';
};

const botId = computed(() => {
  const fromQuery = Number(getQueryString(route.query.bot_id));

  if (Number.isInteger(fromQuery) && fromQuery > 0) {
    return fromQuery;
  }

  if (storedOrderContext.value?.bot_id) {
    return storedOrderContext.value.bot_id;
  }

  const fromConfig = getBotIdNumber();

  return fromConfig > 0 ? fromConfig : Number(config.bot_id) || 0;
});

const orderId = computed(
  () =>
    normalizeOrderId(route.query.order_id) ||
    normalizeOrderId(storedOrderContext.value?.order_id) ||
    fallbackOrderId.value,
);
const amountText = computed(() =>
  amount.value === null ? '' : `${(amount.value / 100).toLocaleString('ru-RU')} ₽`,
);
const requiresTelegram = computed(() => {
  const type = payData.value?.dataPay?.type;

  if (payData.value?.dataPay?.requires_telegram) return true;

  return type === 3 || type === 4 || type === 8;
});
const showCheckButton = computed(() => Boolean(payData.value?.dataPay?.is_button_check));
const isSelectionLocked = computed(
  () =>
    initialLoading.value ||
    selectingGroupId.value !== null ||
    selectingItemId.value !== null ||
    paySubmitting.value ||
    checkSubmitting.value ||
    cancelSubmitting.value,
);
const isAnyActionPending = computed(
  () =>
    initialLoading.value ||
    selectingGroupId.value !== null ||
    selectingItemId.value !== null ||
    paySubmitting.value ||
    checkSubmitting.value ||
    cancelSubmitting.value,
);

const setError = (message: string) => {
  errorMessage.value = message;
  if (message) {
    useDialog(message);
  }
};

const validateInput = (): boolean => {
  if (!botId.value) {
    setError('Не найден bot_id');
    return false;
  }

  if (!orderId.value) {
    setError('Не найден order_id для продолжения оплаты');
    return false;
  }

  return true;
};

const applyStatus = (statusData?: { status?: string; amount?: number }) => {
  if (!statusData) return;

  if (typeof statusData.amount === 'number') {
    amount.value = statusData.amount;
  }

  paid.value = statusData.status === 'paid';
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

const resolveOrderKeyFromAny = (order: Partial<VpnKey>): string =>
  normalizeOrderId(order.order_id) || normalizeOrderId(order.id) || normalizeOrderId(order.key);

const buildStatusPatch = (
  statusData: PaymentOrderStatusData,
  fallback: { statusText: string; paymentStatus: string; isPaid: boolean },
): Partial<VpnKey> => {
  const nextStatus = parseNumberOrNull(statusData.status);
  const trafficLimit = parseNumberOrNull(statusData.traffic_limit);
  const trafficLimitGb = parseNumberOrNull(statusData.traffic_limit_gb);
  const finishAt = parseNumberOrNull(statusData.finish_at);
  const activatedAt = parseNumberOrNull(statusData.activated_at);
  const configUrl = typeof statusData.config_url === 'string' ? statusData.config_url.trim() : '';
  const statusText =
    typeof statusData.status_text === 'string' && statusData.status_text.trim()
      ? statusData.status_text.trim()
      : fallback.statusText;
  const paymentStatus =
    typeof statusData.payment_status === 'string' && statusData.payment_status.trim()
      ? statusData.payment_status.trim()
      : fallback.paymentStatus;

  return {
    status: nextStatus !== null ? Math.floor(nextStatus) : fallback.isPaid ? 1 : 0,
    status_text: statusText,
    payment_status: paymentStatus,
    ...(configUrl ? { config_url: configUrl } : {}),
    ...(trafficLimit !== null ? { traffic_limit: Math.floor(trafficLimit) } : {}),
    ...(trafficLimitGb !== null ? { traffic_limit_gb: trafficLimitGb } : {}),
    ...(finishAt !== null ? { finish_at: String(Math.floor(finishAt)) } : {}),
    ...(activatedAt !== null ? { activated_at: String(Math.floor(activatedAt)) } : {}),
  };
};

const patchLocalOrder = async (
  statusData: PaymentOrderStatusData,
  fallback: { statusText: string; paymentStatus: string; isPaid: boolean },
) => {
  const normalizedCurrentOrderId = orderId.value;
  if (!normalizedCurrentOrderId) return;

  const orders = await getAllOrders();
  const existingOrder = orders.find(
    (order) => resolveOrderKeyFromAny(order) === normalizedCurrentOrderId,
  );
  if (!existingOrder) return;

  const updatedOrder: VpnKey = {
    ...existingOrder,
    ...buildStatusPatch(statusData, fallback),
  };

  await upsertOrder(updatedOrder);
  vpn.addOrder(updatedOrder);
};

const refreshOrdersFromStorage = async () => {
  const orders = await getAllOrders();
  vpn.setOrders(orders);
};

const isPendingOrder = (order: VpnKey): boolean => {
  const statusText = order.status_text.trim().toLowerCase();
  if (statusText.includes('ожидает оплат')) return true;
  if (statusText.includes('awaiting payment')) return true;
  if (statusText.includes('pending payment')) return true;

  return order.status === 0 && !order.config_url;
};

const resolveOrderIdFromOrder = (order: VpnKey): string => {
  if (order.order_id) return normalizeOrderId(order.order_id);
  if (order.id) return normalizeOrderId(order.id);
  return normalizeOrderId(order.key);
};

const resolveFallbackOrderId = async (): Promise<void> => {
  if (orderId.value) return;

  try {
    const orders = await getAllOrders();
    const pendingOrder = orders.find((order) => isPendingOrder(order));
    if (!pendingOrder) return;

    const resolvedOrderId = resolveOrderIdFromOrder(pendingOrder);
    if (!resolvedOrderId) return;

    fallbackOrderId.value = resolvedOrderId;
  } catch {
    // ignore fallback errors, validateInput покажет сообщение
  }
};

const goHomeToOrders = async () => {
  stopPolling();
  await clearStoredPaymentOrderContext();
  storedOrderContext.value = null;
  vpn.setTab('orders');
  await router.push('/');
  await refreshOrdersFromStorage();
};

const syncOrderQueryWithState = async () => {
  const queryBotId = Number(getQueryString(route.query.bot_id));
  const queryOrderId = getQueryString(route.query.order_id);
  const hasCorrectQuery =
    Number.isInteger(queryBotId) &&
    queryBotId > 0 &&
    queryOrderId === orderId.value &&
    queryBotId === botId.value;

  if (hasCorrectQuery) return;

  await router.replace({
    path: '/payment',
    query: {
      ...route.query,
      bot_id: String(botId.value),
      order_id: orderId.value,
    },
  });
};

const handleRedirectAction = async (statusData?: {
  redirect_action?: string | null;
  redirect_data?: Record<string, unknown> | null;
}): Promise<boolean> => {
  if (!statusData) return false;

  const action = (statusData.redirect_action || '').trim().toLowerCase();
  const redirectData =
    statusData.redirect_data && typeof statusData.redirect_data === 'object'
      ? statusData.redirect_data
      : null;
  const redirectPath =
    redirectData && typeof redirectData.path === 'string' ? redirectData.path : '';
  const redirectUrl = redirectData && typeof redirectData.url === 'string' ? redirectData.url : '';

  if (action === 'home') {
    await goHomeToOrders();
    return true;
  }

  if (
    action === 'route' ||
    action === 'router' ||
    action === 'path' ||
    (!action && Boolean(redirectPath))
  ) {
    if (!redirectPath) return false;
    await router.push(redirectPath);
    return true;
  }

  if (
    action === 'url' ||
    action === 'link' ||
    action === 'external' ||
    (!action && Boolean(redirectUrl))
  ) {
    if (!redirectUrl || typeof window === 'undefined') return false;
    window.location.assign(redirectUrl);
    return true;
  }

  return false;
};

const handlePaidState = async (statusData?: PaymentOrderStatusData): Promise<boolean> => {
  applyStatus(statusData);
  if (statusData?.status !== 'paid') return false;

  await patchLocalOrder(statusData, {
    statusText: 'Оплачен',
    paymentStatus: 'paid',
    isPaid: true,
  });

  stopPolling();
  const redirected = await handleRedirectAction(statusData);
  if (!redirected) {
    await goHomeToOrders();
  }

  return true;
};

const fetchStatus = async (): Promise<boolean> => {
  const response = await PaymentOrderService.getStatus({
    bot_id: botId.value,
    order_id: orderId.value,
  });
  if (!response.result) {
    throw new Error(response.message || 'Не удалось получить статус заказа');
  }

  return handlePaidState(response.data);
};

const fetchGroups = async (): Promise<boolean> => {
  const response = await PaymentOrderService.getGroups({
    bot_id: botId.value,
    order_id: orderId.value,
  });

  if (!response.result) {
    throw new Error(response.message || 'Не удалось получить группы оплаты');
  }

  const paidNow = await handlePaidState(response.data);
  if (paidNow) return true;
  groups.value = response.data.groups || [];
  return false;
};

const fetchItems = async (groupId: number): Promise<boolean> => {
  const response = await PaymentOrderService.getItems({
    bot_id: botId.value,
    order_id: orderId.value,
    group_id: groupId,
  });

  if (!response.result) {
    throw new Error(response.message || 'Не удалось получить способы оплаты');
  }

  const paidNow = await handlePaidState(response.data);
  if (paidNow) return true;
  items.value = response.data.items || [];
  return false;
};

const fetchPayData = async (itemId: number): Promise<boolean> => {
  const response = await PaymentOrderService.getPayData({
    bot_id: botId.value,
    order_id: orderId.value,
    item_id: itemId,
  });

  if (!response.result) {
    throw new Error(response.message || 'Не удалось получить данные оплаты');
  }

  const paidNow = await handlePaidState(response.data);
  if (paidNow) return true;
  payData.value = response.data;
  return false;
};

const openPaymentInExternalBrowser = (url: string | undefined): boolean => {
  if (!url || typeof window === 'undefined') return false;
  return Boolean(window.open(url, '_blank', 'noopener,noreferrer'));
};

const closeCustomBrowser = () => {
  customBrowserOpen.value = false;
  customBrowserLoading.value = false;
};

const handleCustomBrowserFrameError = () => {
  customBrowserLoading.value = false;
  setError('Не удалось открыть страницу оплаты во встроенном браузере');
};

const openPaymentInCustomBrowser = (url: string | undefined): boolean => {
  if (!url) return false;

  customBrowserUrl.value = url;
  customBrowserLoading.value = true;
  customBrowserOpen.value = true;
  return true;
};

const selectGroup = async (groupId: number) => {
  if (isSelectionLocked.value) {
    return;
  }

  try {
    selectingGroupId.value = groupId;
    errorMessage.value = '';
    selectedGroupId.value = groupId;
    selectedItemId.value = null;
    payData.value = null;
    lastAutoOpenedItemId.value = null;

    await fetchItems(groupId);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Ошибка загрузки способов оплаты');
  } finally {
    selectingGroupId.value = null;
  }
};

const selectItem = async (itemId: number) => {
  if (isSelectionLocked.value) {
    return;
  }

  try {
    selectingItemId.value = itemId;
    errorMessage.value = '';
    selectedItemId.value = itemId;
    const paidNow = await fetchPayData(itemId);
    if (paidNow) return;

    const currentPayData = payData.value;
    const isExternalPay =
      currentPayData?.dataPay?.type === 1 || currentPayData?.dataPay?.type === 6;

    if (isExternalPay) {
      const link =
        currentPayData?.dataPay?.type === 1
          ? currentPayData.dataPay.link
          : currentPayData?.dataPay?.web_app;
      const opened = openPaymentInCustomBrowser(link);
      if (!opened && lastAutoOpenedItemId.value !== itemId) {
        setError('Не удалось открыть страницу оплаты во встроенном браузере');
      }
      lastAutoOpenedItemId.value = itemId;
    }
  } catch (error) {
    selectedItemId.value = null;
    payData.value = null;
    setError(error instanceof Error ? error.message : 'Ошибка загрузки шага оплаты');
  } finally {
    selectingItemId.value = null;
  }
};

const submitPayInput = async () => {
  if (!selectedItemId.value) {
    setError('Сначала выберите способ оплаты');
    return;
  }

  try {
    paySubmitting.value = true;
    errorMessage.value = '';
    const response = await PaymentOrderService.setPayInput({
      bot_id: botId.value,
      order_id: orderId.value,
      item_id: selectedItemId.value,
      input_value: payInputValue.value.trim(),
    });

    if (!response.result) {
      throw new Error(response.message || 'Не удалось отправить данные');
    }

    await fetchPayData(selectedItemId.value);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Ошибка отправки данных');
  } finally {
    paySubmitting.value = false;
  }
};

const checkPayment = async () => {
  try {
    checkSubmitting.value = true;
    errorMessage.value = '';
    const response = await PaymentOrderService.checkPay({
      bot_id: botId.value,
      order_id: orderId.value,
    });

    if (!response.result) {
      throw new Error(response.message || 'Не удалось проверить оплату');
    }

    if (await handlePaidState(response.data)) return;

    await fetchStatus();
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Ошибка проверки оплаты');
  } finally {
    checkSubmitting.value = false;
  }
};

const cancelFlow = async () => {
  let navigated = false;

  try {
    cancelSubmitting.value = true;
    errorMessage.value = '';
    const response = await PaymentOrderService.cancel({
      bot_id: botId.value,
      order_id: orderId.value,
    });
    if (!response.result) {
      throw new Error(response.message || 'Не удалось отменить оплату');
    }

    await patchLocalOrder(response.data, {
      statusText: 'Отменен',
      paymentStatus: 'cancelled',
      isPaid: false,
    });

    if (await handleRedirectAction(response.data)) {
      navigated = true;
      return;
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Ошибка отмены');
  } finally {
    cancelSubmitting.value = false;
    if (!navigated) {
      await goHomeToOrders();
    }
  }
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const startPolling = () => {
  stopPolling();

  pollTimer = setInterval(() => {
    void (async () => {
      if (isAnyActionPending.value || paid.value) return;

      try {
        await fetchStatus();
      } catch {
        stopPolling();
      }
    })();
  }, 7000);
};

const initialize = async () => {
  fallbackOrderId.value = '';
  storedOrderContext.value = await getStoredPaymentOrderContext();
  await resolveFallbackOrderId();

  if (!validateInput()) return;

  try {
    initialLoading.value = true;
    errorMessage.value = '';
    await savePaymentOrderContext({
      bot_id: botId.value,
      order_id: orderId.value,
    });
    storedOrderContext.value = await getStoredPaymentOrderContext();
    await syncOrderQueryWithState();

    if (await fetchStatus()) return;

    if (await fetchGroups()) return;
    startPolling();
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Ошибка загрузки страницы оплаты');
  } finally {
    initialLoading.value = false;
  }
};

onMounted(async () => {
  await initialize();
});

onBeforeUnmount(() => {
  stopPolling();
  closeCustomBrowser();
});
</script>

<style scoped lang="scss">
.payment-shell {
  position: relative;
}

.payment-page {
  position: relative;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
}

.payment-browser-frame {
  width: 100%;
  height: 100%;
  border: 0;
}

.payment-hero,
.payment-block,
.payment-alert {
  border: 1px solid rgba(255, 255, 255, 0.42);
  background:
    linear-gradient(155deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.32)),
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.14), transparent 62%);
  box-shadow:
    0 16px 44px rgba(17, 24, 39, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(18px) saturate(130%);
  -webkit-backdrop-filter: blur(18px) saturate(130%);
  color: rgba(15, 23, 42, 0.96);
}

.payment-kicker {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.74rem;
  font-weight: 700;
  color: rgba(25, 118, 210, 0.9);
}

.payment-muted {
  color: rgba(17, 24, 39, 0.68);
}

.payment-amount-chip {
  min-width: 148px;
  padding: 12px 16px;
  border-radius: 18px;
  border: 1px solid rgba(25, 118, 210, 0.22);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.64));
}

.payment-status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(120, 53, 15, 0.95);
  background: rgba(251, 191, 36, 0.22);
}

.payment-status--paid {
  color: rgba(22, 101, 52, 0.95);
  background: rgba(74, 222, 128, 0.2);
}

.payment-step-title {
  font-size: 1.02rem;
  line-height: 1.3;
  font-weight: 700;
}

.payment-choice {
  border: 1px solid rgba(25, 118, 210, 0.22);
  background: rgba(255, 255, 255, 0.72);
  color: inherit;
}

.payment-choice--active {
  border-color: rgba(25, 118, 210, 0.58);
  background: linear-gradient(145deg, rgba(25, 118, 210, 0.95), rgba(30, 64, 175, 0.92));
  color: #fff;
}

.payment-method {
  border: 1px solid rgba(25, 118, 210, 0.18);
  background: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.payment-method--active {
  border-color: rgba(25, 118, 210, 0.58);
  box-shadow: 0 0 0 1px rgba(25, 118, 210, 0.2);
}

.payment-method--disabled {
  pointer-events: none;
  opacity: 0.65;
}

.payment-btn {
  border: 1px solid transparent;
  font-weight: 600;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.payment-btn--primary {
  color: #fff;
  background: linear-gradient(140deg, #1d4ed8, #2563eb 52%, #3b82f6);
}

.payment-btn--secondary {
  border-color: rgba(25, 118, 210, 0.24);
  background: rgba(255, 255, 255, 0.74);
  color: inherit;
}

.payment-btn--ghost {
  border-color: rgba(17, 24, 39, 0.14);
  color: inherit;
}

.payment-btn--active {
  border-color: rgba(25, 118, 210, 0.54);
}

.payment-shell--dark .payment-hero,
.payment-shell--dark .payment-block,
.payment-shell--dark .payment-alert {
  border-color: rgba(255, 255, 255, 0.18);
  background:
    linear-gradient(155deg, rgba(19, 22, 31, 0.56), rgba(15, 18, 26, 0.36)),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 62%);
  box-shadow:
    0 18px 52px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px) saturate(130%);
  -webkit-backdrop-filter: blur(18px) saturate(130%);
  color: rgba(255, 255, 255, 0.94);
}

.payment-shell--dark .payment-muted {
  color: rgba(255, 255, 255, 0.7);
}

.payment-shell--dark .payment-amount-chip,
.payment-shell--dark .payment-method,
.payment-shell--dark .payment-choice,
.payment-shell--dark .payment-btn--secondary,
.payment-shell--dark .payment-btn--ghost {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
}

.payment-shell--dark .payment-kicker {
  color: rgba(96, 165, 250, 0.96);
}

.payment-shell--dark .payment-status {
  color: rgba(255, 239, 197, 0.95);
  background: rgba(245, 158, 11, 0.24);
}

.payment-shell--dark .payment-status--paid {
  color: rgba(187, 247, 208, 0.96);
  background: rgba(34, 197, 94, 0.26);
}

.payment-shell--dark .payment-choice--active,
.payment-shell--dark .payment-btn--primary {
  background: linear-gradient(140deg, #2563eb, #3b82f6 52%, #60a5fa);
  color: #fff;
}

.payment-shell--dark .payment-btn--secondary:hover,
.payment-shell--dark .payment-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.12);
}

.payment-shell--dark .payment-block :deep(.q-field--outlined .q-field__control) {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
}

.payment-shell--dark .payment-block :deep(.q-field--outlined .q-field__control:before) {
  border-color: rgba(255, 255, 255, 0.24);
}

.payment-shell--dark
  .payment-block
  :deep(.q-field--outlined.q-field--focused .q-field__control:after) {
  border-color: rgba(96, 165, 250, 0.96);
}

.payment-shell--dark .payment-block :deep(.q-field__native),
.payment-shell--dark .payment-block :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.88);
}
</style>

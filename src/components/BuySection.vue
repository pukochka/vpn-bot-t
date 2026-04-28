<template>
  <div class="relative-position">
    <q-card flat bordered class="rounded transparent-style overflow-hidden">
      <div class="text-center q-py-sm">Выберите количество дней</div>

      <q-tabs inline-label align="justify" class="tab-rounded" v-model="vpn.selectedPeriod">
        <q-tab class="rounded" :key="key" :name="key" v-for="(period, key) of periods">
          <div class="text-h6 text-weight-bold">{{ period }}</div>
        </q-tab>
      </q-tabs>
    </q-card>

    <div class="text-center q-my-sm q-py-sm rounded price-total-shell">
      <transition name="price-bg-flow">
        <div
          :key="`price-bg-${vpn.selectedPeriod}`"
          class="price-total-bg"
          :style="priceGradientStyle"
        />
      </transition>

      <div class="price-total-content">
        <div>Итого</div>

        <div class="price-total-value">
          <span class="price-counter" aria-live="polite">
            <span
              v-for="slot in rollingPriceSlots"
              :key="slot.id"
              class="price-counter__slot"
              :class="{ 'price-counter__slot--static': !slot.isDigit }"
            >
              <span v-if="slot.isDigit" class="price-counter__digit-window">
                <span class="price-counter__digit-strip" :style="slotTransformStyle(slot)">
                  <span
                    v-for="(digit, idx) in digitStrip"
                    :key="`${slot.id}-${idx}`"
                    class="price-counter__digit"
                  >
                    {{ digit }}
                  </span>
                </span>
              </span>

              <span v-else class="price-counter__static">{{ slot.staticChar }}</span>
            </span>
          </span>
          <span class="text-h5 text-weight-bold">₽</span>
        </div>
      </div>
    </div>

    <q-card flat bordered class="row transparent-style rounded overflow-hidden">
      <q-btn
        no-caps
        unelevated
        class="col"
        label="Купить"
        :loading="searching"
        :disable="searching"
        @click="buyPeriod"
      />
    </q-card>

    <transition name="search-fade">
      <div v-if="searching" class="modal-buy-searching-overlay column flex-center">
        <div class="search-visual">
          <div class="search-orbit" aria-hidden="true">
            <span
              v-for="n in 8"
              :key="n"
              class="search-orbit-dot"
              :style="{ '--orbit-i': n - 1 }"
            />
          </div>
          <div class="search-core">
            <q-icon name="dns" size="34px" class="search-core-icon" />
          </div>
          <div class="search-pulse search-pulse--a" />
          <div class="search-pulse search-pulse--b" />
        </div>

        <transition name="phrase-slide" mode="out-in">
          <p :key="phraseIndex" class="search-phrase text-center q-px-md q-mt-lg">
            {{ phrases[phraseIndex] }}
          </p>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { VpnService } from 'src/api/vpn';
import {
  PaymentOrderService,
  savePaymentOrderContext,
  type PaymentOrderStatusData,
} from 'src/api/paymentOrder';
import { upsertOrder } from 'src/utils/ordersIndexedDb';
import { periods } from 'stores/vpnModels';
import { useVpnStore } from 'stores/vpnStore';
import config, { getBotIdNumber, getCategoryIdByPeriod } from 'src/utils/config';
import { useDialog } from 'src/utils/useDialog';

const vpn = useVpnStore();
const router = useRouter();

const searching = ref(false);

const phrases = [
  'Подбираем сервера, это может занять время',
  'Мы ищем лучшее для Вас',
  'Сопоставляем нагрузку и регион…',
  'Почти готово — оформляем доступ',
];

const phraseIndex = ref(0);
let phraseTimer: ReturnType<typeof setInterval> | null = null;
let priceAnimationFrame: number | null = null;

const startPhraseRotation = () => {
  phraseIndex.value = 0;
  phraseTimer = setInterval(() => {
    phraseIndex.value = (phraseIndex.value + 1) % phrases.length;
  }, 2600);
};

const stopPhraseRotation = () => {
  if (phraseTimer !== null) {
    clearInterval(phraseTimer);
    phraseTimer = null;
  }
};

onBeforeUnmount(() => {
  stopPhraseRotation();
  if (priceAnimationFrame !== null) {
    cancelAnimationFrame(priceAnimationFrame);
    priceAnimationFrame = null;
  }
});

const price = computed(
  () =>
    Object.fromEntries(vpn.prises.split(',').map((item) => item.split('-')))[vpn.selectedPeriod],
);
const parsedPriceByPeriod = computed<Record<string, number>>(() => {
  const entries = vpn.prises
    .split(',')
    .map((item) => item.split('-'))
    .filter((entry): entry is [string, string] => entry.length === 2)
    .map(([period, rawPrice]) => [period, toPriceNumber(rawPrice)] as const);

  return Object.fromEntries(entries);
});
const selectedPrice = computed(() => parsedPriceByPeriod.value[vpn.selectedPeriod] ?? 0);
const priceGradientIntensity = computed(() => {
  const values = Object.values(parsedPriceByPeriod.value).filter((value) => value > 0);
  if (values.length <= 1) return 0.35;

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0.35;

  const normalized = (selectedPrice.value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized));
});
const priceGradientStyle = computed<Record<string, string>>(() => {
  // Делаем шкалу нелинейной, чтобы переход между ценами был заметно резче.
  const intensity = Math.pow(priceGradientIntensity.value, 1.6);

  const start = 10 + intensity * 36;
  const end = 26 + intensity * 62;
  const accent = 6 + intensity * 34;
  const darkMix = 2 + intensity * 20;

  return {
    '--price-grad-start': `${start.toFixed(2)}%`,
    '--price-grad-end': `${end.toFixed(2)}%`,
    '--price-grad-accent': `${accent.toFixed(2)}%`,
    '--price-grad-dark-mix': `${darkMix.toFixed(2)}%`,
  };
});

type RollingPriceSlot = {
  id: string;
  isDigit: boolean;
  staticChar: string;
  displayIndex: number;
  targetIndex: number;
  durationMs: number;
};

const digitStrip = Array.from({ length: 30 }, (_, index) => index % 10);
const rollingPriceSlots = ref<Array<RollingPriceSlot>>([]);
const previousNumericPrice = ref<number>(0);

const toPriceNumber = (value: unknown): number => {
  const numeric = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizePriceRaw = (value: unknown): string => String(value ?? '0').replace(/\s+/g, '');

const getRollSteps = (from: number, to: number, direction: 'up' | 'down'): number => {
  if (direction === 'up') return (to - from + 10) % 10;
  return (from - to + 10) % 10;
};

const buildRollingPriceSlots = (
  nextRaw: string,
  prevRaw: string,
  direction: 'up' | 'down',
): Array<RollingPriceSlot> => {
  const maxLen = Math.max(nextRaw.length, prevRaw.length);
  const prevPadded = prevRaw.padStart(maxLen, ' ');
  const nextPadded = nextRaw.padStart(maxLen, ' ');

  return Array.from(nextPadded).map((nextChar, index) => {
    const prevChar = prevPadded[index] || ' ';
    const isDigit = /^\d$/.test(nextChar);

    if (!isDigit) {
      return {
        id: `price-static-${index}-${nextChar === ' ' ? 'space' : nextChar}`,
        isDigit: false,
        staticChar: nextChar === ' ' ? '\u00A0' : nextChar,
        displayIndex: 0,
        targetIndex: 0,
        durationMs: 0,
      };
    }

    const fromDigit = /^\d$/.test(prevChar) ? Number(prevChar) : 0;
    const toDigit = Number(nextChar);
    const steps = getRollSteps(fromDigit, toDigit, direction);
    const startIndex = 10 + fromDigit;
    const targetIndex = direction === 'up' ? startIndex + steps : startIndex - steps;

    return {
      id: `price-digit-${index}`,
      isDigit: true,
      staticChar: '',
      displayIndex: startIndex,
      targetIndex,
      durationMs: steps === 0 ? 0 : 180 + steps * 38,
    };
  });
};

const slotTransformStyle = (slot: RollingPriceSlot): Record<string, string> => ({
  transform: `translateY(calc(${slot.displayIndex * -1}em))`,
  transitionDuration: `${slot.durationMs}ms`,
});

watch(
  price,
  (nextValue, prevValue) => {
    const nextRaw = normalizePriceRaw(nextValue);
    const prevRaw = normalizePriceRaw(prevValue ?? nextRaw);

    const nextNumber = toPriceNumber(nextRaw);
    const direction: 'up' | 'down' = nextNumber >= previousNumericPrice.value ? 'up' : 'down';

    rollingPriceSlots.value = buildRollingPriceSlots(nextRaw, prevRaw, direction);
    if (priceAnimationFrame !== null) cancelAnimationFrame(priceAnimationFrame);
    priceAnimationFrame = requestAnimationFrame(() => {
      rollingPriceSlots.value = rollingPriceSlots.value.map((slot) =>
        slot.isDigit ? { ...slot, displayIndex: slot.targetIndex } : slot,
      );
    });
    previousNumericPrice.value = nextNumber;
  },
  { immediate: true },
);

const resolveOrderId = (orderData: { id?: string | number; order_id?: string }): string | null => {
  const externalOrderId = orderData.order_id;
  if (typeof externalOrderId === 'string' && /^o-\d+$/.test(externalOrderId)) {
    return externalOrderId;
  }

  const rawId = orderData.id;
  if (typeof rawId === 'number' && rawId > 0) {
    return `o-${rawId}`;
  }

  if (typeof rawId === 'string') {
    if (/^o-\d+$/.test(rawId)) return rawId;
    if (/^\d+$/.test(rawId)) return `o-${rawId}`;
  }

  return null;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
};

const getFirstString = (sources: Array<Record<string, unknown>>, keys: Array<string>): string => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
  }

  return '';
};

const getFirstNumber = (
  sources: Array<Record<string, unknown>>,
  keys: Array<string>,
): number | null => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      const parsed =
        typeof value === 'number'
          ? value
          : typeof value === 'string' && value.trim()
            ? Number(value)
            : NaN;

      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
};

const buildLocalOrder = (payload: {
  orderId: string;
  selectedPeriod: string;
  createOrderData: Record<string, unknown>;
  statusData: PaymentOrderStatusData | null;
}): VpnKey => {
  const nowSec = Math.floor(Date.now() / 1000);
  const periodDays = periods[Number(payload.selectedPeriod) as keyof typeof periods] || 30;
  const fallbackFinishAt = nowSec + periodDays * 24 * 60 * 60;
  const statusSource = payload.statusData ? asRecord(payload.statusData) : {};
  const sources = [payload.createOrderData, statusSource];
  const statusFromData = getFirstNumber(sources, ['status']);
  const statusText =
    getFirstString(sources, ['status_text']) ||
    (payload.statusData?.status === 'paid' ? 'Оплачен' : 'Ожидает оплаты');

  return {
    key: getFirstString(sources, ['key', 'order_id', 'id']) || payload.orderId,
    order_id: payload.orderId,
    id: getFirstString(sources, ['id']),
    config_url: getFirstString(sources, ['config_url', 'configUrl']),
    traffic_limit: getFirstNumber(sources, ['traffic_limit']) || 0,
    traffic_limit_gb: getFirstNumber(sources, ['traffic_limit_gb']) || 0,
    finish_at: String(Math.floor(getFirstNumber(sources, ['finish_at']) || fallbackFinishAt)),
    activated_at: String(Math.floor(getFirstNumber(sources, ['activated_at']) || nowSec)),
    status:
      statusFromData !== null
        ? Math.floor(statusFromData)
        : payload.statusData?.status === 'paid'
          ? 1
          : 0,
    status_text: statusText,
    payment_status: payload.statusData?.status || 'wait',
    is_free: Boolean(payload.createOrderData.is_free),
  };
};

const buyPeriod = async () => {
  const botId = getBotIdNumber();
  const categoryId = getCategoryIdByPeriod(vpn.selectedPeriod);

  if (!botId) {
    useDialog('Не удалось определить bot_id для создания заказа');
    return;
  }

  if (!categoryId) {
    useDialog(`Для периода ${vpn.selectedPeriod} не настроен category_id в config.json`);
    return;
  }

  try {
    searching.value = true;
    startPhraseRotation();

    const response = await VpnService.createShopOrder({
      bot_id: botId,
      category_id: categoryId,
      count: Number(vpn.selectedPeriod),
    });
    if (!response?.data?.result) {
      throw new Error(response?.data?.message || 'Не удалось создать заказ');
    }

    const createOrderData = asRecord(response.data.data);
    const orderId = resolveOrderId(createOrderData);

    if (!orderId) {
      throw new Error('Сервер не вернул корректный order_id');
    }

    const statusResponse = await PaymentOrderService.getStatus({
      bot_id: botId,
      order_id: orderId,
    });
    if (!statusResponse.result) {
      throw new Error(statusResponse.message || 'Не удалось получить статус заказа');
    }
    const statusData: PaymentOrderStatusData | null = statusResponse.data;

    const localOrder = buildLocalOrder({
      orderId,
      selectedPeriod: vpn.selectedPeriod,
      createOrderData,
      statusData,
    });

    await upsertOrder(localOrder);
    vpn.addOrder(localOrder);

    await savePaymentOrderContext({
      bot_id: botId,
      order_id: orderId,
      create_order_response: createOrderData,
    });

    await router.push({
      path: '/payment',
      query: { bot_id: String(botId || config.bot_id), order_id: orderId },
    });
  } catch (error) {
    useDialog(error instanceof Error ? error.message : 'Не удалось создать заказ');
  } finally {
    stopPhraseRotation();
    searching.value = false;
    vpn.closeModal('buy');
  }
};
</script>

<style scoped lang="scss">
.price-total-shell {
  position: relative;
  overflow: hidden;
}

.price-total-bg {
  position: absolute;
  inset: 0;
  will-change: opacity, filter;
  background: linear-gradient(
    138deg,
    color-mix(in srgb, var(--q-primary) var(--price-grad-start, 20%), #ffffff),
    color-mix(
      in srgb,
      var(--q-primary) var(--price-grad-end, 56%),
      #0f172a var(--price-grad-dark-mix, 8%)
    )
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff 65%, transparent),
    0 8px 20px color-mix(in srgb, var(--q-primary) var(--price-grad-accent, 12%), transparent);
}

.price-total-content {
  position: relative;
  z-index: 1;
}

.price-total-value {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.price-counter {
  display: inline-flex;
  align-items: baseline;
  font-size: 1.5rem;
  line-height: 1em;
  font-weight: 700;
  white-space: pre;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings:
    'tnum' 1,
    'lnum' 1;
}

.price-counter__slot {
  display: inline-flex;
  flex: 0 0 0.72em;
  width: 0.72em;
  height: 1em;
  justify-content: center;
  align-items: center;
  vertical-align: baseline;
}

.price-counter__slot--static {
  width: auto;
  flex: 0 0 auto;
}

.price-counter__digit-window {
  display: block;
  height: 1em;
  width: 100%;
  line-height: 1em;
  overflow: hidden;
}

.price-counter__digit-strip {
  display: flex;
  flex-direction: column;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  will-change: transform;
}

.price-counter__digit {
  display: inline-flex;
  width: 100%;
  height: 1em;
  line-height: 1em;
  align-items: center;
  justify-content: center;
}

.price-counter__static {
  display: inline-block;
  line-height: 1em;
  vertical-align: baseline;
}

.price-bg-flow-enter-active,
.price-bg-flow-leave-active {
  transition:
    opacity 0.52s ease,
    filter 0.52s ease;
}

.price-bg-flow-enter-from,
.price-bg-flow-leave-to {
  opacity: 0;
  filter: saturate(1.2) blur(8px);
}
</style>

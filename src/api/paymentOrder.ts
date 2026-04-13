import axios, { type AxiosResponse } from 'axios';
import { getApiV1Url } from 'src/utils/config';

export interface PublicApiResponse<T> {
  result: boolean;
  data: T;
  message?: string;
}

export interface PaymentOrderStatusData {
  status: string;
  amount?: number;
  redirect_action?: string | null;
  redirect_data?: Record<string, unknown> | null;
  status_text?: string;
  payment_status?: string;
  config_url?: string;
  finish_at?: string | number;
  activated_at?: string | number;
  traffic_limit?: string | number;
  traffic_limit_gb?: string | number;
}

export interface PaymentGroup {
  id: number;
  title?: string;
  name?: string;
}

export interface PaymentGroupsData extends PaymentOrderStatusData {
  groups?: Array<PaymentGroup>;
}

export interface PaymentItemDesign {
  title?: string;
  text_button?: string;
  description?: string;
}

export interface PaymentItem {
  id: number;
  title?: string;
  design?: PaymentItemDesign;
  data?: Record<string, unknown>;
}

export interface PaymentItemsData extends PaymentOrderStatusData {
  items?: Array<PaymentItem>;
}

export interface PaymentDataPay {
  type?: 0 | 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9;
  text?: string;
  link?: string;
  web_app?: string;
  label_input?: string;
  rules_input?: string;
  is_button_check?: boolean;
  requires_telegram?: boolean;
  next_action?: string;
  next_action_hint?: string;
}

export interface PaymentPayData extends PaymentOrderStatusData {
  id?: number | string;
  button_cancel_pay?: string;
  button_check_pay?: string | null;
  userContacts?: null;
  item?: PaymentItem;
  dataPay?: PaymentDataPay;
}

export interface StoredPaymentOrderContext {
  bot_id: number;
  order_id: string;
  created_at: number;
  updated_at: number;
  create_order_response?: Record<string, unknown> | undefined;
}

const buildUrl = (action: string): string => `${getApiV1Url()}/payment/order/${action}`;
const PAYMENT_CONTEXT_DB_NAME = 'vpn-payment-order-context-db';
const PAYMENT_CONTEXT_DB_VERSION = 1;
const PAYMENT_CONTEXT_STORE = 'payment_order_context';
const PAYMENT_CONTEXT_KEY = 'active_order';

const postPublic = async <T>(
  action: string,
  payload: Record<string, Any>,
): Promise<PublicApiResponse<T>> => {
  const response: AxiosResponse<PublicApiResponse<T>> = await axios.post(
    buildUrl(action),
    payload,
    {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    },
  );

  return response.data;
};

const normalizeOrderId = (value: unknown): string => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return `o-${value}`;
  }

  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^o-\d+$/i.test(trimmed)) return `o-${trimmed.replace(/^o-/i, '')}`;
  if (/^\d+$/.test(trimmed)) return `o-${trimmed}`;

  return '';
};

const isIndexedDbAvailable = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.indexedDB);

const openPaymentContextDb = async (): Promise<IDBDatabase> => {
  if (!isIndexedDbAvailable()) {
    throw new Error('IndexedDB is not available');
  }

  return await new Promise((resolve, reject) => {
    const request = window.indexedDB.open(PAYMENT_CONTEXT_DB_NAME, PAYMENT_CONTEXT_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PAYMENT_CONTEXT_STORE)) {
        database.createObjectStore(PAYMENT_CONTEXT_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB open failed'));
  });
};

const withPaymentContextStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest,
): Promise<T> => {
  const database = await openPaymentContextDb();

  return await new Promise((resolve, reject) => {
    const transaction = database.transaction(PAYMENT_CONTEXT_STORE, mode);
    const store = transaction.objectStore(PAYMENT_CONTEXT_STORE);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB request failed'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () =>
      reject(new Error(transaction.error?.message || 'IndexedDB transaction failed'));
  });
};

export const getStoredPaymentOrderContext = async (): Promise<StoredPaymentOrderContext | null> => {
  if (!isIndexedDbAvailable()) return null;

  try {
    const rawRecord = await withPaymentContextStore<{ key: string; value: unknown } | undefined>(
      'readonly',
      (store) => store.get(PAYMENT_CONTEXT_KEY),
    );
    const parsed = rawRecord?.value as Partial<StoredPaymentOrderContext> | null | undefined;

    if (!parsed || typeof parsed !== 'object') return null;
    if (!Number.isInteger(parsed.bot_id) || Number(parsed.bot_id) <= 0) return null;
    const normalizedOrderId = normalizeOrderId(parsed.order_id);
    if (!normalizedOrderId) return null;

    return {
      bot_id: Number(parsed.bot_id),
      order_id: normalizedOrderId,
      created_at:
        typeof parsed.created_at === 'number' && Number.isFinite(parsed.created_at)
          ? parsed.created_at
          : Date.now(),
      updated_at:
        typeof parsed.updated_at === 'number' && Number.isFinite(parsed.updated_at)
          ? parsed.updated_at
          : Date.now(),
      create_order_response:
        parsed.create_order_response && typeof parsed.create_order_response === 'object'
          ? parsed.create_order_response
          : undefined,
    };
  } catch {
    return null;
  }
};

export const savePaymentOrderContext = async (payload: {
  bot_id: number;
  order_id: string;
  create_order_response?: Record<string, unknown>;
}): Promise<void> => {
  if (!isIndexedDbAvailable()) return;
  if (!Number.isInteger(payload.bot_id) || payload.bot_id <= 0) return;
  const normalizedOrderId = normalizeOrderId(payload.order_id);
  if (!normalizedOrderId) return;

  const current = await getStoredPaymentOrderContext();
  const now = Date.now();
  const nextValue: StoredPaymentOrderContext = {
    bot_id: payload.bot_id,
    order_id: normalizedOrderId,
    created_at: current?.created_at ?? now,
    updated_at: now,
    create_order_response: payload.create_order_response ?? current?.create_order_response,
  };

  try {
    await withPaymentContextStore<IDBValidKey>('readwrite', (store) =>
      store.put({ key: PAYMENT_CONTEXT_KEY, value: nextValue }),
    );
  } catch {
    // Ignore write errors (private mode / quota exceeded / unsupported env)
  }
};

export const clearStoredPaymentOrderContext = async (): Promise<void> => {
  if (!isIndexedDbAvailable()) return;

  try {
    await withPaymentContextStore<IDBValidKey>('readwrite', (store) =>
      store.delete(PAYMENT_CONTEXT_KEY),
    );
  } catch {
    // Ignore remove errors
  }
};

export class PaymentOrderService {
  static async getStatus(payload: { bot_id: number; order_id: string }) {
    return postPublic<PaymentOrderStatusData>('get-status', payload);
  }

  static async getGroups(payload: { bot_id: number; order_id: string }) {
    return postPublic<PaymentGroupsData>('get-groups', payload);
  }

  static async getItems(payload: { bot_id: number; order_id: string; group_id: number }) {
    return postPublic<PaymentItemsData>('get-items', payload);
  }

  static async getPayData(payload: { bot_id: number; order_id: string; item_id: number }) {
    return postPublic<PaymentPayData>('get-pay-data', payload);
  }

  static async setPayInput(payload: {
    bot_id: number;
    order_id: string;
    item_id: number;
    input_value: string;
  }) {
    return postPublic<PaymentPayData>('set-pay-input', payload);
  }

  static async checkPay(payload: { bot_id: number; order_id: string }) {
    return postPublic<PaymentOrderStatusData>('check-pay', payload);
  }

  static async cancel(payload: { bot_id: number; order_id: string }) {
    return postPublic<PaymentOrderStatusData>('cancel', payload);
  }
}

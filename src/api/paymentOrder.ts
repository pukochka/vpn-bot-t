import axios, { type AxiosResponse } from 'axios';
import { getApiV1Url } from 'src/utils/config';

interface PublicApiResponse<T> {
  result: boolean;
  data: T;
  message?: string;
}

export interface PaymentOrderStatusData {
  order_id?: string;
  history_id?: number | string;
  status: string;
  amount?: number | string;
  redirect_action?: string | null;
  redirect_data?: Record<string, unknown> | null;
  status_text?: string;
  payment_status?: string;
  config_url?: string;
  key?: string | null;
  finish_at?: string | number;
  activated_at?: string | number;
  traffic_limit?: string | number;
  traffic_limit_gb?: string | number;
}

export interface PaymentGroup {
  id: number;
  title?: string;
  name?: string;
  text_choose?: string;
  sort?: number;
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
  group_id?: number;
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
  order_id: string;
  email?: string;
  created_at: number;
  updated_at: number;
  create_order_response?: Record<string, unknown> | undefined;
}

const ORDER_ID_PREFIXES = ['mp', 'o'] as const;

export const normalizeOrderId = (value: unknown): string => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return `mp-${value}`;
  }

  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  for (const prefix of ORDER_ID_PREFIXES) {
    const pattern = new RegExp(`^${prefix}-\\d+$`, 'i');
    if (pattern.test(trimmed)) {
      return `${prefix}-${trimmed.replace(new RegExp(`^${prefix}-`, 'i'), '')}`;
    }
  }

  if (/^\d+$/.test(trimmed)) {
    return `mp-${trimmed}`;
  }

  return '';
};

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
    const normalizedOrderId = normalizeOrderId(parsed.order_id);
    if (!normalizedOrderId) return null;

    return {
      order_id: normalizedOrderId,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
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
  order_id: string;
  email?: string;
  create_order_response?: Record<string, unknown>;
}): Promise<void> => {
  if (!isIndexedDbAvailable()) return;
  const normalizedOrderId = normalizeOrderId(payload.order_id);
  if (!normalizedOrderId) return;

  const current = await getStoredPaymentOrderContext();
  const now = Date.now();
  const nextValue: StoredPaymentOrderContext = {
    order_id: normalizedOrderId,
    email: payload.email ?? current?.email,
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
  static async getGroups(payload: { order_id: string }) {
    return postPublic<PaymentGroupsData>('get-groups', payload);
  }

  static async getItems(payload: { order_id: string; group_id: number }) {
    return postPublic<PaymentItemsData>('get-items', payload);
  }

  static async getPayData(payload: { order_id: string; item_id: number }) {
    return postPublic<PaymentPayData>('get-pay-data', payload);
  }

  static async setPayInput(payload: {
    order_id: string;
    item_id: number;
    input_value: string;
  }) {
    return postPublic<PaymentPayData>('set-pay-input', payload);
  }

  static async checkPay(payload: { order_id: string }) {
    return postPublic<PaymentOrderStatusData>('check-pay', payload);
  }

  static async cancel(payload: { order_id: string }) {
    return postPublic<PaymentOrderStatusData>('cancel', payload);
  }
}

import type { AxiosResponse } from 'axios';
import { api } from './instance';
import {
  cacheApiFetch,
  cacheApiSave,
  CACHE_NAME_API_GET,
  CacheApiType,
  isCacheApiSupported,
} from 'src/utils/cacheApi';
import { getApiV1Url } from 'src/utils/config';

function cacheKeyShopSettings(): string {
  return `${getApiV1Url()}/shoppublic/settings`;
}

function isSuccessfulCachedPayload(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  return Boolean(o.result === true || o.success === true);
}

function asCachedAxiosResponse<T>(data: T): AxiosResponse<T, Any> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as Any,
  };
}

export interface ShopProduct {
  product_id: number;
  days: number;
  title: string;
  price: number;
  amount: number;
  currency: string;
}

export interface ShopSettingsData {
  shop: { domain: string; is_active: boolean };
  products: Array<ShopProduct>;
}

export interface CreateShopOrderPayload {
  product_id: number;
  email: string;
}

export interface CreateShopOrderResponse {
  id?: number | string;
  order_id?: string;
  messagePaymentId?: number;
  user?: unknown;
  amount?: string | number;
  balanceType?: string;
  balanceDiscount?: number;
  itemId?: number | null;
  dataId?: number | null;
  receiptId?: number | null;
  key?: string | null;
  config_url?: string;
  traffic_limit?: number | string;
  traffic_limit_gb?: number | string;
  finish_at?: string | number;
  activated_at?: string | number;
  status?: number | string;
  status_text?: string;
  createdAt?: string;
  updatedAt?: string;
  itemData?: string;
  bot_clone_id?: number | null;
  purchase_bot_title?: string;
  email?: string;
  history_id?: number | string;
  external_order_id?: string;
  is_free?: boolean;
}

export class VpnService {
  /** Первый запрос к API витрины: товары и цены для экрана покупки. */
  static async getShopSettings(
    options: { skipCache?: boolean } = {},
  ): Promise<AxiosResponse<{ result: boolean; data: ShopSettingsData; message?: string }>> {
    type ShopSettingsResponse = { result: boolean; data: ShopSettingsData; message?: string };

    const key = cacheKeyShopSettings();
    if (!options.skipCache && (await isCacheApiSupported())) {
      const hit = await cacheApiFetch(CACHE_NAME_API_GET, key, CacheApiType.Json);
      if (hit && isSuccessfulCachedPayload(hit)) {
        return asCachedAxiosResponse(hit as ShopSettingsResponse);
      }
    }

    const response = await api.get<ShopSettingsResponse>({
      url: '/shoppublic/settings',
    });

    if (isSuccessfulCachedPayload(response.data)) {
      void cacheApiSave(CACHE_NAME_API_GET, key, response.data);
    }

    return response;
  }

  static async createShopOrder(
    payload: CreateShopOrderPayload,
  ): Promise<AxiosResponse<{ result: boolean; data: CreateShopOrderResponse; message?: string }>> {
    return await api.post<{ result: boolean; data: CreateShopOrderResponse; message?: string }>({
      url: '/shoppublic/order/create',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

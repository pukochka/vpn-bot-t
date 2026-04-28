import type { AxiosResponse } from 'axios';
import { api } from './instance';
import {
  cacheApiFetch,
  cacheApiSave,
  CACHE_NAME_API_GET,
  CacheApiType,
  isCacheApiSupported,
} from 'src/utils/cacheApi';
import config, { getApiV1Url, getKeyActivateBaseUrl } from 'src/utils/config';

function cacheKeySettings(): string {
  const params = new URLSearchParams({ public_key: config.public_key });
  return `${getApiV1Url()}/bot-module/settings?${params.toString()}`;
}

function cacheKeyInstructions(): string {
  const params = new URLSearchParams({ public_key: config.public_key });
  return `${getKeyActivateBaseUrl()}vpn-instructions?${params.toString()}`;
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

export interface CreateShopOrderPayload {
  bot_id: number;
  category_id: number;
  count?: number;
}

export interface CreateShopOrderResponse {
  id?: number | string;
  order_id?: string;
  key?: string;
  config_url?: string;
  traffic_limit?: number | string;
  traffic_limit_gb?: number | string;
  finish_at?: string | number;
  activated_at?: string | number;
  status?: number | string;
  status_text?: string;
  is_free?: boolean;
}

export class VpnService {
  /** Возвращает список всех ключей, принадлежащих пользователю. */
  static async instructions(): Promise<
    AxiosResponse<{ sections: Array<VpnInstruction>; success: boolean; support_text: string }>
  > {
    type InstructionsData = {
      sections: Array<VpnInstruction>;
      success: boolean;
      support_text: string;
    };

    const key = cacheKeyInstructions();
    if (await isCacheApiSupported()) {
      const hit = await cacheApiFetch(CACHE_NAME_API_GET, key, CacheApiType.Json);
      if (hit && isSuccessfulCachedPayload(hit)) {
        return asCachedAxiosResponse(hit as InstructionsData);
      }
    }

    const response = await api.get<InstructionsData>({
      // Instructions intentionally use key-activate API, not the common v1 base.
      url: `${getKeyActivateBaseUrl()}vpn-instructions`,
      params: { public_key: config.public_key },
    });

    if (isSuccessfulCachedPayload(response.data)) {
      void cacheApiSave(CACHE_NAME_API_GET, key, response.data);
    }

    return response;
  }

  /**  */
  static async settings(): Promise<AxiosResponse<Any>> {
    const key = cacheKeySettings();
    if (await isCacheApiSupported()) {
      const hit = await cacheApiFetch(CACHE_NAME_API_GET, key, CacheApiType.Json);
      if (hit && isSuccessfulCachedPayload(hit)) {
        return asCachedAxiosResponse(hit as Any);
      }
    }

    const response = await api.get<Any>({
      url: '/bot-module/settings',
      params: { public_key: config.public_key },
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

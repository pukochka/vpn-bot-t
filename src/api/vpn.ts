import type { AxiosResponse } from 'axios';
import { api } from './instance';
import config, { getApiV1Url, getKeyActivateBaseUrl } from 'src/utils/config';

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
    return await api.get<{
      sections: Array<VpnInstruction>;
      success: boolean;
      support_text: string;
    }>({
      // Instructions intentionally use key-activate API, not the common v1 base.
      url: `${getKeyActivateBaseUrl()}vpn-instructions`,
      params: { public_key: config.public_key },
    });
  }

  /**  */
  static async settings(): Promise<AxiosResponse<Any>> {
    return await api.get<Any>({
      url: '/bot-module/settings',
      params: { public_key: config.public_key },
    });
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

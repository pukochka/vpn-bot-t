import type { AxiosResponse } from 'axios';
import { api } from './instance';
import config from 'src/utils/config';
import { getHash } from 'src/utils/string';

export class VpnService {
  static async auth(): Promise<AxiosResponse> {
    return await api.post<VpnResponseInstance<VpnKey>>({
      url: config.authUrl + 'module/bot/check-hash',
      data: { bot_id: config.bot_id, userData: getHash() },
    });
  }

  /** Позволяет пользователю купить и активировать ключ VPN через бота продаж */
  static async buy(
    public_key: string,
    user_tg_id: string,
    product_id: string,
    user_secret_key: string,
  ): Promise<AxiosResponse<VpnResponseInstance<VpnKey>>> {
    return await api.post<VpnResponseInstance<VpnKey>>({
      url: 'buy-key',
      data: { public_key, user_secret_key, product_id, user_tg_id },
    });
  }

  /** Предоставляет пользователю бесплатный ключ на 5GB трафика (1 ключ в месяц). */
  static async free(
    public_key: string,
    user_tg_id: string,
  ): Promise<AxiosResponse<VpnResponseInstance<VpnKey>>> {
    return await api.post<VpnResponseInstance<VpnKey>>({
      url: 'free-key',
      data: { public_key, user_tg_id },
    });
  }

  /** Возвращает список всех ключей, принадлежащих пользователю. */
  static async orders(
    user_tg_id: string,
  ): Promise<AxiosResponse<VpnResponseInstance<{ keys: Array<VpnKey>; message: string }>>> {
    return await api.post<VpnResponseInstance<{ keys: Array<VpnKey>; message: string }>>({
      url: 'user-key',
      data: { user_tg_id },
    });
  }

  /** Возвращает информацию о конкретном ключе. */
  static async keyInfo(key: string): Promise<AxiosResponse<VpnResponseInstance<{ key: VpnKey }>>> {
    return await api.post<VpnResponseInstance<{ key: VpnKey }>>({
      url: 'user-key',
      data: { key },
    });
  }

  /** Возвращает список всех ключей, принадлежащих пользователю. */
  static async instructions(): Promise<
    AxiosResponse<{ sections: Array<VpnInstruction>; success: boolean; support_text: string }>
  > {
    return await api.get<{
      sections: Array<VpnInstruction>;
      success: boolean;
      support_text: string;
    }>({
      url: 'vpn-instructions',
    });
  }
}

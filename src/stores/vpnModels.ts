import type { ShopProduct } from 'src/api/vpn';

export type ModalNames = 'order' | 'buy';

export type { ShopProduct };

export interface VpnModels {
  tab: 'buy' | 'info' | 'orders';
  error: boolean;
  loading: boolean;
  modals: Record<ModalNames, boolean>;
  selectedPeriod: string;

  products: Array<ShopProduct>;
  shopSettingsLoaded: boolean;

  page: number;
  total: number;

  orders: Array<VpnKey>;
  selectedOrder: VpnKey | null;
}

export const defaultKey: VpnKey = {
  key: '',
  config_url: '',
  traffic_limit: 0,
  traffic_limit_gb: 0,
  finish_at: '',
  activated_at: '',
  status: 0,
  status_text: '',
  is_free: false,
};

export const months = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export interface VpnModels {
  tab: 'buy' | 'profile' | 'info' | 'orders';
  error: boolean;
  loading: boolean;
  loadingOrders: boolean;
  modals: Record<ModalNames, boolean>;
  selectedPeriod: string;

  prises: string;

  page: number;
  limit: number;
  total: number;

  orders: Array<VpnKey>;
  selectedOrder: VpnKey | null;

  instructions: { success: boolean; sections: Array<VpnInstruction>; support_text: string };
}

export type ModalNames = 'order' | 'buy';

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

export const periods = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};

export interface VpnModels {
  tab: 'buy' | 'profile' | 'info' | 'orders';
  error: boolean;
  loading: boolean;
  loadingOrders: boolean;
  modals: Record<ModalNames, boolean>;
  selectedPeriod: string;

  user: User;
  prises: string;

  page: number;
  limit: number;
  total: number;

  orders: Array<VpnKey>;
  selectedOrder: VpnKey | null;

  instructions: { success: boolean; sections: Array<VpnInstruction>; support_text: string };
}

export type ModalNames = 'free' | 'order' | 'buy';

export const defaultKey: VpnKey = {
  key: '',
  config_url: '',
  traffic_limit: 0,
  traffic_limit_gb: 0,
  finish_at: '',
  activated_at: '',
  status: '',
  status_text: '',
  is_free: false,
};

export const defaultUser: User = {
  id: 0,
  bot_id: 0,
  user: {
    id: 0,
    telegram_id: 0,
    username: '',
    first_name: '',
    last_name: '',
    link: '',
    type: '',
  },
  ref: null,
  money: 0,
  status: 0,
  create_at: 0,
  update_at: 0,
  secret_user_key: '',
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

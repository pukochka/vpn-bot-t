import { useId } from 'quasar';

export interface VpnModels {
  tab: 'buy' | 'profile' | 'info' | 'orders';
  modals: Record<ModalNames, boolean>;
  selectedPeriod: string;

  orders: Array<VpnKey>;
  selectedOrder: VpnKey | null;

  instructions: { success: boolean; sections: Array<VpnInstruction>; support_text: string };
}

export type ModalNames = 'free' | 'order' | 'buy';

export const defaultKey: VpnKey = {
  key: useId() as string,
  config_url: 'trojan://',
  traffic_limit: 5,
  traffic_limit_gb: 15,
  finish_at: '',
  activated_at: '',
  status: 'active',
  status_text: '',
  is_free: false,
};

import type { ModalNames, VpnModels } from './vpnModels';
import { defaultKey, defaultUser } from './vpnModels';
import { defineStore, acceptHMRUpdate } from 'pinia';

export const useVpnStore = defineStore('vpn', {
  state: (): VpnModels => ({
    tab: 'buy',
    error: false,
    loading: true,
    loadingOrders: false,
    instructions: { sections: [], success: false, support_text: '' },

    modals: { free: false, order: false, buy: false },

    selectedPeriod: '1',

    user: defaultUser,
    prises: '1-150,3-400,6-600,12-1100',

    orders: [],
    selectedOrder: defaultKey,
  }),

  getters: {
    userTgId: (state: VpnModels) => state.user.user.telegram_id,
    secretKey: (state: VpnModels) => state.user.secret_user_key,
  },

  actions: {
    openModal(name: ModalNames) {
      this.modals[name] = true;
    },
    closeModal(name: ModalNames) {
      this.modals[name] = false;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVpnStore, import.meta.hot));
}

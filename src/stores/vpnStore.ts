import type { ModalNames, VpnModels } from './vpnModels';
import { defaultKey } from './vpnModels';
import { defineStore, acceptHMRUpdate } from 'pinia';

export const useVpnStore = defineStore('vpn', {
  state: (): VpnModels => ({
    tab: 'buy',
    instructions: { sections: [], success: false, support_text: '' },

    modals: { free: false, order: false, buy: false },

    selectedPeriod: '12',

    orders: [],
    selectedOrder: defaultKey,
  }),

  getters: {},

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

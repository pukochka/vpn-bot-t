import type { ModalNames, VpnModels } from './vpnModels';
import { defaultKey } from './vpnModels';
import { defineStore, acceptHMRUpdate } from 'pinia';

export const useVpnStore = defineStore('vpn', {
  state: (): VpnModels => ({
    tab: 'buy',
    error: false,
    loading: true,
    loadingOrders: false,
    instructions: { sections: [], success: false, support_text: '' },

    modals: { order: false, buy: false },

    selectedPeriod: '1',
    prises: '1-150,3-400,6-600,12-1100',

    orders: [],
    selectedOrder: defaultKey,

    page: 1,
    limit: 5,
    total: 0,
  }),

  getters: {
    totalActive: (state: VpnModels) => state.orders.filter((order) => order.status !== 0).length,
    totalDisable: (state: VpnModels) => state.orders.filter((order) => order.status !== 1).length,
  },

  actions: {
    setTab(tab: VpnModels['tab']) {
      this.tab = tab;
    },
    openModal(name: ModalNames) {
      this.modals[name] = true;
    },
    closeModal(name: ModalNames) {
      this.modals[name] = false;
    },
    setOrders(orders: Array<VpnKey>) {
      this.orders = orders;
      this.total = orders.length;
      this.page = 1;
    },
    addOrder(order: VpnKey) {
      const existingIndex = this.orders.findIndex((item) => item.key === order.key);

      if (existingIndex === -1) {
        this.orders.unshift(order);
      } else {
        this.orders.splice(existingIndex, 1, order);
      }

      this.total = this.orders.length;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVpnStore, import.meta.hot));
}

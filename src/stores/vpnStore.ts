import type { ModalNames, VpnModels } from './vpnModels';
import type { ShopSettingsData } from 'src/api/vpn';
import { defaultKey } from './vpnModels';
import { defineStore, acceptHMRUpdate } from 'pinia';

export const useVpnStore = defineStore('vpn', {
  state: (): VpnModels => ({
    tab: 'buy',
    error: false,
    loading: true,

    modals: { order: false, buy: false },

    selectedPeriod: '1',
    products: [],
    shopSettingsLoaded: false,

    orders: [],
    selectedOrder: defaultKey,

    page: 1,
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
    setShopSettings(settings: ShopSettingsData) {
      const products = [...(settings.products || [])].sort(
        (left, right) => left.product_id - right.product_id,
      );

      this.products = products;
      this.shopSettingsLoaded = true;

      if (products.length > 0) {
        const hasSelected = products.some(
          (product) => String(product.product_id) === this.selectedPeriod,
        );
        if (!hasSelected) {
          this.selectedPeriod = String(products[0]?.product_id ?? '1');
        }
      }
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

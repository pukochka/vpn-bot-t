import { Dark } from 'quasar';
import { boot } from 'quasar/wrappers';
import config from 'src/utils/config';
import { VpnService } from 'src/api/vpn';
import { useVpnStore } from 'stores/vpnStore';

export default boot(() => {
  const vpn = useVpnStore();

  Dark.set(config.dark);

  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.enableClosingConfirmation();

  Promise.all([VpnService.auth(), VpnService.settings()])
    .then(([responseAuth, responseSettings]) => {
      vpn.user = responseAuth.data.data;
      vpn.prises = responseSettings.data.data?.tariff_cost;
    })
    .catch(() => {
      vpn.error = true;
    })
    .finally(() => {
      vpn.loading = false;
    });
});

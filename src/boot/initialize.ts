import { Dark } from 'quasar';
import { boot } from 'quasar/wrappers';
import { VpnService } from 'src/api/vpn';
import { useVpnStore } from 'stores/vpnStore';
import vXssHtml from 'src/utils/vXssHtml';

export default boot(({ app }) => {
  const vpn = useVpnStore();

  Dark.set(window.Telegram.WebApp.colorScheme === 'dark');

  app.directive('xss-html', vXssHtml);

  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.enableClosingConfirmation();

  Promise.all([VpnService.auth(), VpnService.settings()])
    .then(([responseAuth, responseSettings]) => {
      vpn.user = responseAuth.data.data;
      vpn.prises = responseSettings.data.data?.tariff_cost;
      vpn.freeShow = responseSettings.data.data?.free_show;
    })
    .catch(() => {})
    .finally(() => {
      vpn.loading = false;
    });
});

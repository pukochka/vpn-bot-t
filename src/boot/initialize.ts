import { Dark, LocalStorage } from 'quasar';
import { boot } from 'quasar/wrappers';
import { VpnService } from 'src/api/vpn';
import { useVpnStore } from 'stores/vpnStore';
import { normalizeThemeId, THEME_STORAGE_KEY, useColor } from 'src/utils/useColor';
import vXssHtml from 'src/utils/vXssHtml';

const HEADING_STORAGE_KEY = 'vpn_heading';

export default boot(({ app }) => {
  const vpn = useVpnStore();

  Dark.set(window.Telegram.WebApp.colorScheme === 'dark');

  app.directive('xss-html', vXssHtml);

  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.enableClosingConfirmation();

  const localHeading = LocalStorage.getItem(HEADING_STORAGE_KEY);
  const localColor = normalizeThemeId(LocalStorage.getItem(THEME_STORAGE_KEY));

  if (typeof localHeading === 'string' && localHeading.length > 0) {
    vpn.heading = localHeading;
  }

  vpn.color = localColor;
  useColor(vpn.color);

  Promise.all([VpnService.auth(), VpnService.settings()])
    .then(([responseAuth, responseSettings]) => {
      vpn.user = responseAuth.data.data;
      vpn.prises = responseSettings.data.data?.tariff_cost;
      vpn.freeShow = responseSettings.data.data?.free_show;
      vpn.heading = responseSettings.data.data?.heading || vpn.heading;
      vpn.color = normalizeThemeId(responseSettings.data.data?.color);

      LocalStorage.set(HEADING_STORAGE_KEY, vpn.heading);

      useColor(vpn.color);
    })
    .catch(() => {})
    .finally(() => {
      vpn.loading = false;
    });
});

import '@fontsource-variable/geom';

import { Dark, LocalStorage } from 'quasar';
import { boot } from 'quasar/wrappers';
import { useVpnStore } from 'stores/vpnStore';
import vXssHtml from 'src/utils/vXssHtml';

const THEME_STORAGE_KEY = 'isDarkTheme';

export default boot(({ app }) => {
  const vpn = useVpnStore();
  const savedTheme = LocalStorage.getItem(THEME_STORAGE_KEY);

  if (typeof savedTheme === 'boolean') {
    Dark.set(savedTheme);
  } else {
    Dark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  app.directive('xss-html', vXssHtml);

  vpn.loading = false;
});

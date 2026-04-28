import { Dark, LocalStorage } from 'quasar';
import { boot } from 'quasar/wrappers';
import { syncApiBaseUrl } from 'src/api/instance';
import config, { applyThemePrimaryFromConfig, initRuntimeConfig } from 'src/utils/config';
import { configureCacheApiTtl, scheduleCacheApiCleanup } from 'src/utils/cacheApi';
import { useVpnStore } from 'stores/vpnStore';
import vXssHtml from 'src/utils/vXssHtml';

const THEME_STORAGE_KEY = 'isDarkTheme';

export default boot(async ({ app }) => {
  await initRuntimeConfig();
  syncApiBaseUrl();

  const vpn = useVpnStore();
  const savedTheme = LocalStorage.getItem(THEME_STORAGE_KEY);

  if (typeof savedTheme === 'boolean') {
    Dark.set(savedTheme);
  } else {
    Dark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  applyThemePrimaryFromConfig();

  configureCacheApiTtl({ emojiMs: config.cacheTtlEmojiMs, apiGetMs: config.cacheTtlApiGetMs });
  scheduleCacheApiCleanup();

  app.directive('xss-html', vXssHtml);

  vpn.loading = false;
});

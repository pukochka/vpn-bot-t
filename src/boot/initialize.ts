import { Dark, LocalStorage } from 'quasar';
import { boot } from 'quasar/wrappers';
import { syncApiBaseUrl } from 'src/api/instance';
import { VpnService } from 'src/api/vpn';
import config, { applyThemePrimaryFromConfig, initRuntimeConfig } from 'src/utils/config';
import { configureCacheApiTtl, scheduleCacheApiCleanup } from 'src/utils/cacheApi';
import { useDialog } from 'src/utils/useDialog';
import { useVpnStore } from 'stores/vpnStore';
import vXssHtml from 'src/utils/vXssHtml';

const THEME_STORAGE_KEY = 'isDarkTheme';

const loadShopSettings = async (): Promise<void> => {
  const vpn = useVpnStore();

  try {
    const response = await VpnService.getShopSettings({ skipCache: true });
    if (!response?.data?.result) {
      throw new Error(response?.data?.message || 'Не удалось загрузить настройки витрины');
    }

    const settings = response.data.data;
    vpn.setShopSettings(settings);

    if (!settings.shop?.is_active) {
      vpn.error = true;
      useDialog('Витрина временно недоступна');
      return;
    }

    if (!settings.products?.length) {
      vpn.error = true;
      useDialog('В витрине нет доступных тарифов');
    }
  } catch (error) {
    vpn.error = true;
    useDialog(error instanceof Error ? error.message : 'Не удалось загрузить настройки витрины');
  } finally {
    vpn.loading = false;
  }
};

export default boot(async ({ app }) => {
  await initRuntimeConfig();
  syncApiBaseUrl();

  // Первый запрос к backend витрины: GET /v1/shoppublic/settings
  await loadShopSettings();

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
});

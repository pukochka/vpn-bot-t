import bundledSetting from '../../public/config.json';
import { colors, Dark, setCssVar } from 'quasar';
import { resolveProxyStarsConfig, type ProxyStarsResolved } from 'src/utils/proxyStarsConfig';

import lighten = colors.lighten;
import getPaletteColor = colors.getPaletteColor;

const TEST_SHOP_API_ROOT = 'https://rex85.vpn-telegram.com/api';
const normalizeDomain = (value: string): string => value.replace(/\/+$/, '');

const isLocalHostname = (hostname: string): boolean =>
  hostname === 'localhost' || hostname === '127.0.0.1';

let apiRootUrlOverride = '';

const resolveShopApiRoot = (): string => {
  if (apiRootUrlOverride.trim()) {
    return normalizeDomain(apiRootUrlOverride.trim());
  }

  if (typeof window === 'undefined') {
    return TEST_SHOP_API_ROOT;
  }

  const host = window.location.hostname;
  if (isLocalHostname(host)) {
    return '/api';
  }

  return `https://${host}/api`;
};

let settingRecord = bundledSetting as Record<string, unknown>;

const clampThemeColorId = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) return 1;

  return Math.min(5, Math.max(1, Math.floor(parsed)));
};

const THEME_PRIMARY_COLORS: Record<number, string> = {
  1: '#1976d2',
  2: '#43aa8b',
  3: '#90be6d',
  4: '#f8961e',
  5: '#ef745c',
};
let themeColorId = clampThemeColorId(settingRecord.color);
let activePrimaryColor = THEME_PRIMARY_COLORS[themeColorId] ?? '#1976d2';
let proxyStars: ProxyStarsResolved = resolveProxyStarsConfig(settingRecord.proxyStars);

const parsePositiveNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
};

export let cacheTtlEmojiMs = 5 * 24 * 60 * 60 * 1000;
export let cacheTtlApiGetMs = 30 * 60 * 1000;

const config = {
  instructions: '',
  themeColorId,
  primaryColor: activePrimaryColor,
  proxyStars,
  cacheTtlEmojiMs,
  cacheTtlApiGetMs,
};

const applyConfigRecord = (nextSettingRecord: Record<string, unknown>): void => {
  settingRecord = nextSettingRecord;

  themeColorId = clampThemeColorId(settingRecord.color);
  activePrimaryColor = THEME_PRIMARY_COLORS[themeColorId] ?? '#1976d2';
  proxyStars = resolveProxyStarsConfig(settingRecord.proxyStars);

  const cacheRecord = settingRecord.cache as Record<string, unknown> | undefined;
  const days = parsePositiveNumber(cacheRecord?.emojiTtlDays);
  cacheTtlEmojiMs =
    days !== null ? Math.round(days * 24 * 60 * 60 * 1000) : 5 * 24 * 60 * 60 * 1000;

  const minutes = parsePositiveNumber(cacheRecord?.apiGetTtlMinutes);
  cacheTtlApiGetMs = minutes !== null ? Math.round(minutes * 60 * 1000) : 30 * 60 * 1000;

  const runtimeInstructions = settingRecord.instructions;

  config.instructions = typeof runtimeInstructions === 'string' ? runtimeInstructions : '';
  const runtimeApiRootUrl = settingRecord.apiRootUrl;
  apiRootUrlOverride =
    typeof runtimeApiRootUrl === 'string' && runtimeApiRootUrl.trim()
      ? runtimeApiRootUrl.trim()
      : '';
  config.themeColorId = themeColorId;
  config.primaryColor = activePrimaryColor;
  config.proxyStars = proxyStars;
  config.cacheTtlEmojiMs = cacheTtlEmojiMs;
  config.cacheTtlApiGetMs = cacheTtlApiGetMs;
};

let runtimeConfigInitPromise: Promise<void> | null = null;

export const initRuntimeConfig = async (): Promise<void> => {
  if (runtimeConfigInitPromise) {
    return runtimeConfigInitPromise;
  }

  runtimeConfigInitPromise = (async () => {
    if (!import.meta.env.PROD || typeof window === 'undefined') {
      applyConfigRecord(bundledSetting as Record<string, unknown>);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}config.json`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const runtimeConfigUnknown = (await response.json()) as unknown;

      if (!runtimeConfigUnknown || typeof runtimeConfigUnknown !== 'object') {
        throw new Error('Invalid runtime config');
      }

      applyConfigRecord(runtimeConfigUnknown as Record<string, unknown>);
    } catch (error) {
      console.warn(
        'Failed to load runtime config from public/config.json, using bundled fallback',
        error,
      );
      applyConfigRecord(bundledSetting as Record<string, unknown>);
    }
  })();

  return runtimeConfigInitPromise;
};

applyConfigRecord(bundledSetting as Record<string, unknown>);

export const getApiV1Url = (): string => {
  return `${resolveShopApiRoot()}/v1`;
};

/** Синхронизирует Quasar `--q-primary` c цветом из config.color (осветление в тёмной теме). */
export const applyThemePrimaryFromConfig = (): void => {
  if (typeof document === 'undefined') return;

  setCssVar('primary', activePrimaryColor);
  setCssVar('primary', lighten(getPaletteColor('primary'), Dark.isActive ? 30 : 0));
};

export type { ProxyStarsResolved };

export default config;

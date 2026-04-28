import bundledSetting from '../../public/config.json';
import { colors, Dark, setCssVar } from 'quasar';
import { resolveProxyStarsConfig, type ProxyStarsResolved } from 'src/utils/proxyStarsConfig';
import { getQueryParam } from 'src/utils/string';

import lighten = colors.lighten;
import getPaletteColor = colors.getPaletteColor;

const API_ROOT_URL = 'https://api.bot-t.com';
const API_V1_URL = 'https://api.bot-t.com/v1';
const KEY_ACTIVATE_SUFFIX = '/api/v1/key-activate/';
const normalizeDomain = (value: string): string => value.replace(/\/+$/, '');
const stripKeyActivateSuffix = (value: string): string =>
  normalizeDomain(value).replace(/\/api\/v1\/key-activate$/, '');

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
let activePrimaryColor = THEME_PRIMARY_COLORS[themeColorId] ?? THEME_PRIMARY_COLORS[1];
let proxyStars: ProxyStarsResolved = resolveProxyStarsConfig(settingRecord.proxyStars);

const parsePositiveNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
};

/** TTL Cache Storage для `.tgs` эмоджи (мс), по умолчанию 5 суток */
export let cacheTtlEmojiMs = 5 * 24 * 60 * 60 * 1000;

/** TTL Cache Storage для кэшируемых GET API (мс), по умолчанию 30 минут */
export let cacheTtlApiGetMs = 30 * 60 * 1000;

const config = {
  api_root_url: normalizeDomain(API_ROOT_URL),
  api_v1_url: normalizeDomain(API_V1_URL),
  bot_id: getQueryParam('bot_id') || '254886',
  public_key: getQueryParam('public_key') || '086c6e666b6fd472113bda91a27567b1',
  shopCategoryMap: {} as Record<string, number>,
  instructions: '',
  themeColorId,
  primaryColor: activePrimaryColor,
  proxyStars,
  cacheTtlEmojiMs,
  cacheTtlApiGetMs,
};

const applyConfigRecord = (nextSettingRecord: Record<string, unknown>): void => {
  settingRecord = nextSettingRecord;

  const shopCategoryMapRaw = settingRecord.shopCategoryMap as Record<string, unknown> | undefined;
  const normalizedShopCategoryMap = Object.fromEntries(
    Object.entries(shopCategoryMapRaw || {})
      .map(([period, categoryId]) => [period, Number(categoryId)])
      .filter(([, categoryId]) => Number.isInteger(categoryId)),
  ) as Record<string, number>;

  themeColorId = clampThemeColorId(settingRecord.color);
  activePrimaryColor = THEME_PRIMARY_COLORS[themeColorId] ?? THEME_PRIMARY_COLORS[1];
  proxyStars = resolveProxyStarsConfig(settingRecord.proxyStars);

  const cacheRecord = settingRecord.cache as Record<string, unknown> | undefined;
  const days = parsePositiveNumber(cacheRecord?.emojiTtlDays);
  cacheTtlEmojiMs = days !== null ? Math.round(days * 24 * 60 * 60 * 1000) : 5 * 24 * 60 * 60 * 1000;

  const minutes = parsePositiveNumber(cacheRecord?.apiGetTtlMinutes);
  cacheTtlApiGetMs = minutes !== null ? Math.round(minutes * 60 * 1000) : 30 * 60 * 1000;

  const runtimeBotId = settingRecord.botId;
  const runtimePublicKey = settingRecord.publicKey;
  const runtimeInstructions = settingRecord.instructions;

  config.bot_id =
    (typeof runtimeBotId === 'string' && runtimeBotId.trim()) ||
    (typeof runtimeBotId === 'number' && Number.isFinite(runtimeBotId) ? String(runtimeBotId) : '') ||
    getQueryParam('bot_id') ||
    '254886';
  config.public_key =
    (typeof runtimePublicKey === 'string' && runtimePublicKey.trim()) ||
    (typeof runtimePublicKey === 'number' && Number.isFinite(runtimePublicKey)
      ? String(runtimePublicKey)
      : '') ||
    getQueryParam('public_key') ||
    '086c6e666b6fd472113bda91a27567b1';
  config.shopCategoryMap = normalizedShopCategoryMap;
  config.instructions = typeof runtimeInstructions === 'string' ? runtimeInstructions : '';
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
      console.warn('Failed to load runtime config from public/config.json, using bundled fallback', error);
      applyConfigRecord(bundledSetting as Record<string, unknown>);
    }
  })();

  return runtimeConfigInitPromise;
};

applyConfigRecord(bundledSetting as Record<string, unknown>);

export const getBotIdNumber = (): number => {
  const botId = Number(config.bot_id);

  return Number.isInteger(botId) && botId > 0 ? botId : 0;
};

export const getCategoryIdByPeriod = (period: string): number | null => {
  const categoryId = config.shopCategoryMap[period];

  if (!categoryId) return null;

  return Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null;
};

export const getApiRootUrl = (): string => {
  return stripKeyActivateSuffix(config.api_root_url);
};

export const getApiV1Url = (): string => {
  return config.api_v1_url;
};

export const getKeyActivateBaseUrl = (): string => {
  return getApiRootUrl() + KEY_ACTIVATE_SUFFIX;
};

/** Синхронизирует Quasar `--q-primary` c цветом из config.color (как в useColor: осветление в тёмной теме). */
export const applyThemePrimaryFromConfig = (): void => {
  if (typeof document === 'undefined') return;

  setCssVar('primary', activePrimaryColor);
  setCssVar('primary', lighten(getPaletteColor('primary'), Dark.isActive ? 30 : 0));
};

export type { ProxyStarsResolved };

export default config;

import setting from '../../config.json';
import { getQueryParam } from 'src/utils/string';

const API_ROOT_URL = 'https://api.bot-t.com';
const API_V1_URL = 'https://api.bot-t.com/v1';
const KEY_ACTIVATE_SUFFIX = '/api/v1/key-activate/';
const shopCategoryMapRaw = setting.shopCategoryMap as Record<string, unknown> | undefined;
const normalizedShopCategoryMap = Object.fromEntries(
  Object.entries(shopCategoryMapRaw || {})
    .map(([period, categoryId]) => [period, Number(categoryId)])
    .filter(([, categoryId]) => Number.isInteger(categoryId)),
) as Record<string, number>;
const normalizeDomain = (value: string): string => value.replace(/\/+$/, '');
const stripKeyActivateSuffix = (value: string): string =>
  normalizeDomain(value).replace(/\/api\/v1\/key-activate$/, '');

const config = {
  api_root_url: normalizeDomain(API_ROOT_URL),
  api_v1_url: normalizeDomain(API_V1_URL),
  bot_id: setting.botId || getQueryParam('bot_id') || '254886',
  public_key:
    setting.publicKey || getQueryParam('public_key') || '086c6e666b6fd472113bda91a27567b1',
  shopCategoryMap: normalizedShopCategoryMap,
};

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

export default config;

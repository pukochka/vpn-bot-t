import setting from '../../config.json';
import { getQueryParam } from 'src/utils/string';

const DEFAULT_DOMAIN = 'https://vpnhigh.su';
const domainCandidates = Array.isArray(setting.domain)
  ? setting.domain
  : [setting.domain || DEFAULT_DOMAIN];
const domains = domainCandidates.filter(
  (domain): domain is string => typeof domain === 'string' && Boolean(domain),
);

let activeDomainIndex = 0;

const getDomainByIndex = (index: number): string => domains[index] || DEFAULT_DOMAIN;

export const getNextBackendUrl = (): string | null => {
  if (domains.length <= 1) {
    return null;
  }

  activeDomainIndex = (activeDomainIndex + 1) % domains.length;

  return getDomainByIndex(activeDomainIndex);
};

export const getCurrentBackendUrl = (): string => {
  return getDomainByIndex(activeDomainIndex);
};

export default {
  backends: domains.length ? domains : [DEFAULT_DOMAIN],
  url: getCurrentBackendUrl(),
  authUrl: setting.authDomain || 'https://api.bot-t.com/v1/',

  bot_id: setting.botId || getQueryParam('bot_id'),
  public_key: setting.publicKey || getQueryParam('public_key'),
};

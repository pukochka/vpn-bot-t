import setting from '../../config.json';
import { getQueryParam } from 'src/utils/string';

export default {
  url: setting.domain || 'https://vpnhigh.su/',
  authUrl: setting.authDomain || 'https://api.bot-t.com/v1/',

  bot_id: setting.botId || getQueryParam('bot_id'),
  public_key: setting.publicKey || getQueryParam('public_key'),
};

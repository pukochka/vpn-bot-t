import { getQueryParam } from 'src/utils/string';

export default {
  url: 'https://vpn-telegram.com/api/v1/key-activate/',
  authUrl: 'https://api.bot-t.com/v1/',

  bot_id: getQueryParam('bot_id') || 886,
  public_key: getQueryParam('public_key') || 'd7c3dfaae085801e284e3534004e818d',

  dark: window.Telegram.WebApp.colorScheme === 'dark',
};

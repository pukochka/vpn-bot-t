import { getQueryParam } from 'src/utils/string';

export default {
  url: 'https://vpn-telegram.com/api/v1/key-activate/',
  authUrl: 'https://api.bot-t.com/v1/',

  bot_id: getQueryParam('bot_id'),
  public_key: getQueryParam('public_key'),

  dark: true,
  // dark: window.Telegram.WebApp.colorScheme === 'dark',
};

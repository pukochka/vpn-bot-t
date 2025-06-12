import { Dark } from 'quasar';
import { boot } from 'quasar/wrappers';
import config from 'src/utils/config';
// import { VpnService } from 'src/api/vpn';

export default boot(() => {
  Dark.set(config.dark);

  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.enableClosingConfirmation();

  // try {
  //   VpnService.auth().then();
  // } catch {
  // } finally {
  // }
});

export function getHash(): string {
  return 'query_id=AAF5WlE9AAAAAHlaUT24hWlW&user=%7B%22id%22%3A1028741753%2C%22first_name%22%3A%22Artem%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22pykochka%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FkUrSHmWBaFXJ4YJCRk8ik6ttfZNiI8PHw18PYev7mfU.svg%22%7D&auth_date=1750149632&signature=EKwtg-KxnQOXvP14rYYF7lX8HDtO0MG_LWT_Ft75Voo-axIHBQh1n0lyUwtXUFKjAk-7s0qC-mYC9hjGOoBqDQ&hash=aa5a6899b01ddd779844d2ac1a82856867c403dd4b90ed88127e3769098333cd';

  // const url = new URL(window.location.href);
  //
  // url.searchParams.delete('service');
  //
  // const index =
  //   url.search.indexOf('&tgWebAppPlatform') === -1
  //     ? url.search.length
  //     : url.search.indexOf('&tgWebAppPlatform');
  //
  // const currentString = url.search.slice(1, index);
  //
  // return window.Telegram.WebApp.initData === ''
  //   ? currentString
  //   : window.Telegram.WebApp.initData;
}

export function getQueryParam(name: string, str?: string) {
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(str ?? window.location.href);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

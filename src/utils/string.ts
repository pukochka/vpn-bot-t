export function getHash(): string {
  return 'query_id=AAF5WlE9AAAAAHlaUT1MiZWz&user=%7B%22id%22%3A1028741753%2C%22first_name%22%3A%22Artem%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22pykochka%22%2C%22language_code%22%3A%22ru%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FkUrSHmWBaFXJ4YJCRk8ik6ttfZNiI8PHw18PYev7mfU.svg%22%7D&auth_date=1751918313&signature=Ks1NkGBqZL7p3DGX8cCi-11-_HVSDlBXqAeKO8H0SLRZyK2xgxcAV509c97coSlhqWzyCR4NFLsVpCJCU9QpAQ&hash=1732a4fb5e9438cf5e85f197da41b9ebfad635b1e7c54758f52145392b6a395c';
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
  // return window.Telegram.WebApp.initData === '' ? currentString : window.Telegram.WebApp.initData;
}

export function getQueryParam(name: string, str?: string) {
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(str ?? window.location.href);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

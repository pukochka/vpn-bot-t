# BOT-T VPN Module

## Быстрый старт

```bash
git clone vpn-bot-t
cd vpn-bot-t
npm install
```

## Настройка

Перед запуском проверьте `config.json` в корне проекта:

- `domain` - домены VPN-сервиса
- `authDomain` - домен API авторизации
- `botId` - ID бота (если нужен)
- `publicKey` - публичный ключ (если нужен)

## Сборка приложения в режиме SPA

```bash
npx quasar build
```

Результат сборки: `dist/spa`.

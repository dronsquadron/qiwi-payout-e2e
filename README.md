# QIWI Payout API v1 — Safe Contract Tests

**Важно:** это учебное тестовое задание. Мы не вызываем рабочий сервис и не исполняем реальные платежи.
По умолчанию все запросы идут на тестовый хост QIWI и выполняются **без** валидных токенов, чтобы получить ожидаемые 401/403 и проверить доступность/контракт ошибок.

Источник документации: https://developer.qiwi.com/ru/payout/v1/

## Состав
- `qiwi-payout.postman_collection.json` — коллекция Postman с 4 запросами и тестами:
  1. Доступ сервиса (GET `/payments`) — проверка 401/403 и структуры ошибки.
  2. Баланс (GET `/balance`) — при 200: `available > 0`.
  3. Создание платежа на 1 RUB (PUT `/payments/{paymentId}`).
  4. Исполнение платежа (POST `/payments/{paymentId}/execute`).

- `tests/playwright/qiwi.payout.spec.ts` — те же проверки на Playwright Test (API testing).

## Как запускать

### Postman (CLI: newman)
```bash
npm i -g newman
newman run qiwi-payout.postman_collection.json   --env-var baseUrl=https://api-test.qiwi.com/partner/payout   --env-var agentId=acme   --env-var pointId=00001   --env-var token=   --env-var paymentId=c0d85b0b-a528-9c66-4a15-cb7a12eda9d6
```

> Токен по умолчанию пустой. Добавив свой тестовый токен, вы сможете проверить позитивные сценарии (200 OK).

### Playwright
```bash
npm init -y
npm i -D @playwright/test
npx playwright install-deps || true

BASE_URL=https://api-test.qiwi.com/partner/payout AGENT_ID=acme POINT_ID=00001 QIWI_TOKEN= PAYMENT_ID=c0d85b0b-a528-9c66-4a15-cb7a12eda9d6 \
npx playwright test tests/playwright/qiwi.payout.spec.ts -c .
```

## Политика безопасности
- Хост по умолчанию — тестовый: `api-test.qiwi.com`.
- Без токена тесты проверяют предсказуемые 401/403 и формат ответа (`CommonError`).
- В теле создания платежа сумма `1.00 RUB`. Это контрактная проверка; без действительных прав операция не исполнится.

## Что можно улучшить
- Добавить JSON Schema-валидацию ответов по моделям `BalanceInfo` и `PaymentInfo`.
- Добавить workflow GitHub Actions (newman + playwright).
- Подключить mock-сервер для воспроизведения позитивных кейсов без внешних вызовов.

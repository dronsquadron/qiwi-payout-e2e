import { test, expect, request, APIRequestContext } from '@playwright/test';

/**
 * Безопасные контрактные проверки против тестового хоста.
 * По умолчанию запускаются с невалидным токеном.
 * Чтобы реально дернуть API в своей среде — передайте QIWI_TOKEN, AGENT_ID, POINT_ID и BASE_URL.
 *
 * Документация: https://developer.qiwi.com/ru/payout/v1/
 */

const BASE_URL = process.env.BASE_URL || 'https://api-test.qiwi.com/partner/payout';
const AGENT_ID = process.env.AGENT_ID || 'acme';
const POINT_ID = process.env.POINT_ID || '00001';
const TOKEN = process.env.QIWI_TOKEN || ''; // оставляем пустым по умолчанию
const PAYMENT_ID = process.env.PAYMENT_ID || 'c0d85b0b-a528-9c66-4a15-cb7a12eda9d6';

async function api(ctx: APIRequestContext) {
  return ctx;
}

test.describe('QIWI Payout v1 — безопасные проверки', () => {

  test('1) Доступ сервиса: GET /payments — ожидаем 401/403 без токена', async ({ request }) => {
    const url = `${BASE_URL}/v1/agents/${AGENT_ID}/points/${POINT_ID}/payments`;
    const res = await request.get(url, {
      headers: { 'Accept': 'application/json' }
    });
    expect([401, 403]).toContain(res.status());
    const ct = res.headers()['content-type'] || '';
    expect(ct).toContain('application/json');
    const body = await res.json().catch(() => ({}));
    if (body.errorCode) {
      expect(body).toHaveProperty('errorCode');
    }
  });

  test('2) Баланс: GET /balance — при 200 available > 0, иначе 401/403', async ({ request }) => {
    const url = `${BASE_URL}/v1/agents/${AGENT_ID}/points/${POINT_ID}/balance`;
    const res = await request.get(url, {
      headers: {
        'Accept': 'application/json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
      }
    });
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('balance');
      expect(body).toHaveProperty('available');
      const available = parseFloat(String(body.available.value).replace(',', '.'));
      expect(available).toBeGreaterThan(0);
    } else {
      expect([401, 403]).toContain(res.status());
    }
  });

  test('3) Создание платежа 1 RUB (PUT /payments/{paymentId})', async ({ request }) => {
    const url = `${BASE_URL}/v1/agents/${AGENT_ID}/points/${POINT_ID}/payments/${PAYMENT_ID}`;
    const res = await request.put(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
      },
      data: {
        recipientDetails: {
          providerCode: 'qiwi-wallet',
          fields: { account: '79990000000' }
        },
        amount: { value: '1.00', currency: 'RUB' },
        source: {
          paymentType: 'NO_EXTRA_CHARGE',
          paymentToolType: 'BANK_ACCOUNT',
          paymentTerminalType: 'INTERNET_BANKING'
        },
        callbackUrl: 'https://example.com/callback'
      }
    });
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('paymentId');
      expect(body).toHaveProperty('status');
      expect(body.amount.value).toBe('1.00');
      expect(body.amount.currency).toBe('RUB');
    } else {
      expect([400, 401, 403, 422]).toContain(res.status());
    }
  });

  test('4) Исполнение платежа (POST /payments/{paymentId}/execute)', async ({ request }) => {
    const url = `${BASE_URL}/v1/agents/${AGENT_ID}/points/${POINT_ID}/payments/${PAYMENT_ID}/execute`;
    const res = await request.post(url, {
      headers: {
        'Accept': 'application/json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
      }
    });
    // В тестовом режиме без токена ожидаем отказ
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('status');
      expect(body.status).toHaveProperty('value');
    } else {
      expect([202, 400, 401, 403, 409, 422]).toContain(res.status());
    }
  });

});

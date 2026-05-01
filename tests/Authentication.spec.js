

const { test, expect } = require('@playwright/test');
const BASE_URL = 'https://kampusnote-api.budasuyasa.workers.dev';

test.describe('Auth Validation Testing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('text=Daftar').first().click();
    await expect(page.locator('#reg-name')).toBeVisible({ timeout: 10000 });
  });

  // TC01 / Bug 01: Email format "20000@gmail.69&87" seharusnya ditolak
  test('TC01 - Bug 01: Registrasi harus gagal jika format email tidak valid', async ({ page, request }) => {
    // Memverifikasi TC01 / Bug 01: Sistem menerima email "20000@gmail.69&87"
    // test.fail() → Playwright berekspektasi test ini GAGAL (karena bug masih ada).
    // Jika bug sudah diperbaiki, test ini akan "fail" karena assertion-nya justru PASS.
    test.fail(true, 'Bug 01: Server masih menerima email format tidak valid seperti "20000@gmail.69&87"');
    const invalidEmail = '20000@gmail.69&87';

    await page.locator('#reg-name').fill('TestUser666');
    await page.locator('#reg-email').fill(invalidEmail);
    await page.locator('#reg-password').fill('password123');

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/auth/register'), { timeout: 10000 }
    ).catch(() => null);

    await page.locator('button:has-text("Daftar Sekarang")').click();
    const registerResponse = await responsePromise;

    if (registerResponse) {
      const status = registerResponse.status();
      const body = await registerResponse.json().catch(() => null);
      console.log(`[Bug 01] Email="${invalidEmail}" Status=${status} Body=${JSON.stringify(body)}`);
      
      // Bug 01: Seharusnya 400 tapi saat ini 200/201
      test.info().annotations.push({
        type: 'bug',
        description: `Bug 01: Email "${invalidEmail}" diterima dengan status ${status}`,
      });
    }

    // Verifikasi langsung via API
    const directResp = await request.post(`${BASE_URL}/api/auth/register`, {
      data: { name: `Direct${Date.now()}`, email: `t${Date.now()}@invalid.123456`, password: 'password123' },
    });
    console.log(`[Bug 01] Direct API: status=${directResp.status()}`);
    // Assertion: Seharusnya 400, tapi bug menyebabkan 200/201
    expect(directResp.status()).toBe(400);
  });

  // TC02 / Bug 02: Username dengan emoji seharusnya ditolak
  test('TC02 - Bug 02: Registrasi harus gagal jika username menggunakan emoji', async ({ page, request }) => {
    // Memverifikasi TC02 / Bug 02
    // test.fail() → Bug masih ada, username emoji diterima server.
    test.fail(true, 'Bug 02: Server masih menerima username yang mengandung emoji');
    const emojiName = '🤣UserTest🏎️💨';
    const testEmail = `emoji_${Date.now()}@kampus.ac.id`;

    await page.locator('#reg-name').fill(emojiName);
    await page.locator('#reg-email').fill(testEmail);
    await page.locator('#reg-password').fill('password123');

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/auth/register'), { timeout: 10000 }
    ).catch(() => null);

    await page.locator('button:has-text("Daftar Sekarang")').click();
    const registerResponse = await responsePromise;

    if (registerResponse) {
      const status = registerResponse.status();
      console.log(`[Bug 02] Username="${emojiName}" Status=${status}`);
      test.info().annotations.push({
        type: 'bug',
        description: `Bug 02: Username emoji diterima dengan status ${status}`,
      });
    }

    // Verifikasi berbagai emoji via API
    const emojiCases = ['🛹Skateboard', '🍔Burger', '🎉🎊🎁'];
    for (const name of emojiCases) {
      const resp = await request.post(`${BASE_URL}/api/auth/register`, {
        data: { name, email: `e${Date.now()}${Math.random().toString(36).slice(2,6)}@kampus.ac.id`, password: 'password123' },
      });
      console.log(`[Bug 02] name="${name}" status=${resp.status()}`);
      expect(resp.status(), `"${name}" seharusnya ditolak`).toBe(400);
    }
  });

  // TC03: Edge case validasi registrasi
  test('TC03 - Validasi registrasi edge cases', async ({ request }) => {
    // Memverifikasi TC03: Berbagai input tidak valid
    // test.fail() → Beberapa edge case tidak divalidasi oleh server.
    test.fail(true, 'TC03: Server tidak memvalidasi beberapa edge case registrasi');
    const cases = [
      { desc: 'Email tanpa domain', data: { name: 'T', email: 'user@', password: 'password123' }, expected: 400 },
      { desc: 'Email tanpa @', data: { name: 'T', email: 'useremail.com', password: 'password123' }, expected: 400 },
      { desc: 'Nama kosong', data: { name: '', email: `e${Date.now()}@kampus.ac.id`, password: 'password123' }, expected: 400 },
      { desc: 'Password pendek', data: { name: 'T', email: `s${Date.now()}@kampus.ac.id`, password: 'a' }, expected: 400 },
    ];

    for (const tc of cases) {
      const resp = await request.post(`${BASE_URL}/api/auth/register`, { data: tc.data });
      console.log(`[TC03] ${tc.desc}: status=${resp.status()}`);
      expect(resp.status(), tc.desc).toBe(tc.expected);
    }
  });
});
import { test, expect } from '@playwright/test';

const VOUCHER_ID = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
const API_URL = 'http://localhost:8080';

test('checkout registra pagamento com o cupom informado na API', async ({ page }) => {
  test.skip(
    process.env.RUN_REAL_COUPON_PAYMENT !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_COUPON_PAYMENT=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar o pagamento real.'
  );

  await page.goto('/login.html');
  await page.getByLabel('Email').fill(process.env.LOGIN_EMAIL);
  await page.getByLabel('Password').fill(process.env.LOGIN_PASSWORD);

  const [loginResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/auth/login` &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Login', exact: true }).click(),
  ]);

  expect(loginResponse.ok()).toBeTruthy();
  await page.waitForURL(/index\.html$/);

  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  // Confirma que o cupom está disponível para este cliente antes de iniciar a compra.
  const vouchersResponse = await page.request.get(`${API_URL}/customer/voucher`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(vouchersResponse.ok()).toBeTruthy();
  const vouchersPayload = await vouchersResponse.json();
  const vouchers = vouchersPayload.content ?? vouchersPayload;
  const voucher = vouchers.find((item) => item.voucherId === VOUCHER_ID);
  expect(voucher, `Cupom ${VOUCHER_ID} não encontrado para o cliente autenticado`).toBeTruthy();

  // Adiciona um produto pelo fluxo normal da loja para garantir um total de compra.
  const productsResponse = await page.request.get(`${API_URL}/public/product`);
  expect(productsResponse.ok()).toBeTruthy();
  const productsPayload = await productsResponse.json();
  const products = productsPayload.content ?? productsPayload;
  const product = products.find((item) => item.category === 'BOOKS' && item.id);
  expect(product, 'A API não retornou produto da categoria BOOKS').toBeTruthy();

  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(`/book-details.html?id=${encodeURIComponent(product.id)}`);
  const [addResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/customer/cart` &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Add To Cart', exact: true }).click(),
  ]);
  expect(addResponse.ok()).toBeTruthy();
  await page.waitForURL(/\/cart\.html$/);
  await expect(
    page.locator('table tbody tr[data-cart-item-id]').filter({ hasText: product.name }).last()
  ).toBeVisible();

  const [cartResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/customer/cart` &&
      response.request().method() === 'GET'
    ),
    page.goto('/checkout.html'),
  ]);
  expect(cartResponse.ok()).toBeTruthy();
  await expect.poll(() => page.evaluate(() => window.checkoutCartTotal)).toBeGreaterThan(0);
  await page.getByRole('radio', { name: 'Coupon Payment', exact: true }).check();
  await page.locator('#couponCode').fill(VOUCHER_ID);

  const payButton = page.locator('#payButton');
  await expect(payButton).toBeEnabled();

  const [paymentResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/payment/checkout` &&
      response.request().method() === 'POST'
    ),
    payButton.click(),
  ]);

  expect(paymentResponse.ok(), `API respondeu HTTP ${paymentResponse.status()}`).toBeTruthy();
  expect(paymentResponse.request().postDataJSON()).toMatchObject({
    typePayment: 'VOUCHER',
    voucherId: VOUCHER_ID,
  });

  // A API é a responsável por persistir o pagamento. Sua resposta de sucesso confirma
  // o processamento; a leitura direta do registro depende de um endpoint de consulta.
});

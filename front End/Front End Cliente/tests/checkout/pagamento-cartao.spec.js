import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const CARD_ID = 'baeda08f-4d4c-4d8b-ad11-48ad995b975a';

test('cliente adiciona um produto ao carrinho e paga com o cartão selecionado', async ({ page }) => {
  test.skip(
    process.env.RUN_REAL_CARD_PAYMENT !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_CARD_PAYMENT=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar o pagamento real.'
  );

  // Login real de cliente.
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
  await page.waitForURL(/\/index\.html$/);
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  // Confirma que a conta possui o cartão indicado e busca um produto real para adicionar.
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [customerResponse, productsResponse] = await Promise.all([
    page.request.get(`${API_URL}/customer/me`, { headers: authHeaders }),
    page.request.get(`${API_URL}/public/product`),
  ]);

  expect(customerResponse.ok()).toBeTruthy();
  expect(productsResponse.ok()).toBeTruthy();

  const customer = await customerResponse.json();
  expect(
    customer.cards?.some((card) => card.cardId === CARD_ID),
    `O cartão ${CARD_ID} não está cadastrado para o cliente autenticado`
  ).toBeTruthy();

  const productsPayload = await productsResponse.json();
  const products = productsPayload.content ?? productsPayload;
  const product = products.find((item) => item.category === 'BOOKS' && item.id);
  expect(product, 'A API não retornou produto da categoria BOOKS').toBeTruthy();

  // Adiciona uma unidade pelo fluxo da página do produto, como um cliente.
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(`/book-details.html?id=${encodeURIComponent(product.id)}`);
  const [addToCartResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/customer/cart` &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Add To Cart', exact: true }).click(),
  ]);

  expect(addToCartResponse.ok()).toBeTruthy();
  await page.waitForURL(/\/cart\.html$/);
  await expect(page.locator('table tbody tr').filter({ hasText: product.name })).toBeVisible();

  // Abre o checkout, seleciona o cartão pelo ID e confirma o pagamento na API real.
  await page.goto('/checkout.html');
  const cardSelect = page.locator('#registeredCards');
  await expect(cardSelect.locator(`option[value="${CARD_ID}"]`)).toHaveCount(1);
  await cardSelect.selectOption(CARD_ID);

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
    typePayment: 'CARD',
    numberCardOne: CARD_ID,
  });
});

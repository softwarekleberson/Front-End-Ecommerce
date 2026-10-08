import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const CARD_NUMBER = '6224756780317750';

test('cliente adiciona um produto, cadastra cartão no checkout e paga', async ({ page }) => {
  test.skip(
    process.env.RUN_REAL_NEW_CARD_PAYMENT !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_NEW_CARD_PAYMENT=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar o pagamento real.'
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

  // Busca e adiciona um produto pelo fluxo da loja.
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

  // Abre o cadastro de cartão pelo botão existente no checkout.
  await page.goto('/checkout.html');
  const [cardPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.locator('#addNewCard').click(),
  ]);
  cardPage.on('dialog', (dialog) => dialog.accept());
  await cardPage.waitForURL(/\/create-card\.html$/);
  await expect(cardPage).toHaveTitle('Add New Card');

  // Dados complementares de teste: número fornecido pelo usuário, CVV e validade fictícios.
  await cardPage.getByLabel('Do You Want to Make This the Main Card?').check();
  await cardPage.getByLabel('Name Printed on Card').fill('PLAYWRIGHT TESTE');
  await cardPage.getByLabel('Card Number').fill(CARD_NUMBER);
  await cardPage.getByLabel('Security Code').fill('123');
  await cardPage.getByLabel('Expiration Date').fill('2040-12-31');
  await cardPage.getByLabel('Brand').selectOption('ELO');

  const [cardResponse] = await Promise.all([
    cardPage.waitForResponse((response) =>
      response.url() === `${API_URL}/customer/card` &&
      response.request().method() === 'POST'
    ),
    cardPage.getByRole('button', { name: 'Register', exact: true }).click(),
  ]);
  expect(cardResponse.ok()).toBeTruthy();
  await cardPage.waitForURL(/\/index\.html$/);

  // Busca o ID do cartão salvo e recarrega o checkout para preencher a lista de cartões.
  const customerResponse = await page.request.get(`${API_URL}/customer/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(customerResponse.ok()).toBeTruthy();
  const customer = await customerResponse.json();
  const newCard = customer.cards?.find((card) => String(card.numberCard) === CARD_NUMBER);
  expect(newCard?.cardId, 'O cartão cadastrado não apareceu nos dados do cliente').toBeTruthy();

  await page.reload();
  const cardSelect = page.locator('#registeredCards');
  await expect(cardSelect.locator(`option[value="${newCard.cardId}"]`)).toHaveCount(1);
  await cardSelect.selectOption(newCard.cardId);
  await expect(page.locator('#payButton')).toBeEnabled();

  const [paymentResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/payment/checkout` &&
      response.request().method() === 'POST'
    ),
    page.locator('#payButton').click(),
  ]);

  expect(paymentResponse.ok(), `API respondeu HTTP ${paymentResponse.status()}`).toBeTruthy();
  expect(paymentResponse.request().postDataJSON()).toMatchObject({
    typePayment: 'CARD',
    numberCardOne: newCard.cardId,
  });
});

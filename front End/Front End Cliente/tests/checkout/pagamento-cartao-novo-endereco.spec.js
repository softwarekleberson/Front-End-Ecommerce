import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const CARD_ID = 'baeda08f-4d4c-4d8b-ad11-48ad995b975a';

test('cliente cadastra endereço, adiciona produto e paga com cartão', async ({ page }) => {
  test.skip(
    process.env.RUN_REAL_NEW_ADDRESS_CARD_PAYMENT !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_NEW_ADDRESS_CARD_PAYMENT=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar o pagamento real.'
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
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Busca um produto real e adiciona uma unidade pelo fluxo da loja.
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

  // Abre o cadastro de endereço a partir do botão do próprio checkout.
  await page.goto('/checkout.html');
  const receiver = `Playwright ${Date.now()}`;
  const [addressPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.locator('#addNewAddress').click(),
  ]);
  addressPage.on('dialog', (dialog) => dialog.accept());
  await addressPage.route('https://viacep.com.br/ws/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    });
  });

  await addressPage.waitForURL(/\/create-delivery\.html$/);
  await addressPage.getByLabel('Main').selectOption('true');
  await addressPage.getByLabel('Receiver').fill(receiver);
  await addressPage.getByLabel('Zip code').fill('01310100');
  const cepLookup = addressPage.waitForResponse((response) => response.url().includes('viacep.com.br/ws/'));
  await addressPage.getByLabel('Type Residence').click();
  await cepLookup;

  await addressPage.getByLabel('Type Residence').fill('Apartment');
  await addressPage.getByLabel('Street Type').fill('Avenue');
  await addressPage.getByLabel('Street Name').fill('Avenida Paulista');
  await addressPage.getByLabel('Number').fill('1000');
  await addressPage.getByLabel('Neighborhood').fill('Bela Vista');
  await addressPage.getByLabel('Additional Info').fill('Playwright payment test');
  await addressPage.getByLabel('City').fill('São Paulo');
  await addressPage.getByLabel('State').fill('SP');
  await addressPage.getByLabel('Country').fill('Brazil');
  await addressPage.getByLabel('Delivery Instructions').fill('Call the receiver before delivery');

  const [deliveryResponse] = await Promise.all([
    addressPage.waitForResponse((response) =>
      response.url() === `${API_URL}/customer/delivery` &&
      response.request().method() === 'POST'
    ),
    addressPage.getByRole('button', { name: 'Save', exact: true }).click(),
  ]);
  expect(deliveryResponse.ok()).toBeTruthy();
  await addressPage.waitForURL(/\/index\.html$/);

  // A aba do checkout recarrega pelo evento checkoutAddressUpdated.
  await expect(page.locator('#street')).toHaveValue('Avenida Paulista');
  await expect(page.locator('#number')).toHaveValue('1000');

  // Confirma que o endereço foi persistido e definido como principal.
  const customerResponse = await page.request.get(`${API_URL}/customer/me`, {
    headers: authHeaders,
  });
  expect(customerResponse.ok()).toBeTruthy();
  const customer = await customerResponse.json();
  expect(
    customer.deliveres?.some((address) => address.receiver === receiver && address.main),
    'O novo endereço principal não apareceu nos dados do cliente'
  ).toBeTruthy();
  expect(
    customer.cards?.some((card) => card.cardId === CARD_ID),
    `Cartão ${CARD_ID} não encontrado na conta do cliente`
  ).toBeTruthy();

  // Seleciona o cartão solicitado e paga.
  const cardSelect = page.locator('#registeredCards');
  await expect(cardSelect.locator(`option[value="${CARD_ID}"]`)).toHaveCount(1);
  await cardSelect.selectOption(CARD_ID);
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
    numberCardOne: CARD_ID,
  });
});

const { test, expect } = require('@playwright/test');

const deliveryData = {
  main: 'true',
  receiver: 'Ana Clara',
  zipCode: '01310100',
  typeResidence: 'Apartment',
  streetType: 'Avenue',
  street: 'Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  observation: 'Leave at the reception desk',
  city: 'São Paulo',
  state: 'SP',
  country: 'Brazil',
  deliveryPhrase: 'Call the receiver before delivery',
};

async function fillDeliveryForm(page) {
  await page.getByLabel('Main').selectOption(deliveryData.main);

  await page.getByLabel('Receiver').fill(deliveryData.receiver);

  await page.getByLabel('Zip code').fill(deliveryData.zipCode);

  await page.getByLabel('Type Residence').fill(deliveryData.typeResidence);

  await page.getByLabel('Street Type').fill(deliveryData.streetType);

  await page.getByLabel('Street Name').fill(deliveryData.street);

  await page.getByLabel('Number').fill(deliveryData.number);

  await page.getByLabel('Neighborhood').fill(deliveryData.neighborhood);

  await page.getByLabel('Additional Info').fill(deliveryData.observation);

  await page.getByLabel('City').fill(deliveryData.city);

  await page.getByLabel('State').fill(deliveryData.state);

  await page.getByLabel('Country').fill(deliveryData.country);

  await page
    .getByLabel('Delivery Instructions')
    .fill(deliveryData.deliveryPhrase);
}

test('cliente consegue preencher o formulário de entrega', async ({ page }) => {
  await page.goto('/create-delivery.html');

  await expect(page).toHaveTitle('New Delivery Address');

  await expect(
    page.getByRole('group', {
      name: 'Add New Delivery Address',
    })
  ).toBeVisible();

  await fillDeliveryForm(page);

  await expect(page.getByLabel('Receiver'))
    .toHaveValue(deliveryData.receiver);

  await expect(page.getByLabel('Zip code'))
    .toHaveValue(deliveryData.zipCode);

  await expect(page.getByLabel('City'))
    .toHaveValue(deliveryData.city);

  await expect(page.getByLabel('Delivery Instructions'))
    .toHaveValue(deliveryData.deliveryPhrase);
});


test('cliente consegue salvar um endereço de entrega no backend', async ({ page }) => {

  test.skip(
    process.env.RUN_REAL_DELIVERY_CREATION !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_DELIVERY_CREATION=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar o cadastro real.'
  );

  // ============================================================
  // LOGIN
  // ============================================================

  await page.goto('/login.html');

  await page.getByLabel('Email').fill(process.env.LOGIN_EMAIL);

  await page.getByLabel('Password').fill(process.env.LOGIN_PASSWORD);

  const [loginResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === 'http://localhost:8080/auth/login' &&
      response.request().method() === 'POST'
    ),

    page.getByRole('button', {
      name: 'Login',
      exact: true,
    }).click(),
  ]);

  expect(loginResponse.ok()).toBeTruthy();

  await page.waitForURL(/index\.html$/);

  await expect(page).toHaveURL(/index\.html$/);

  // Verifica se o JWT foi armazenado
  await expect(
    page.evaluate(() => localStorage.getItem('token'))
  ).resolves.toBeTruthy();


  // ============================================================
  // ACESSA O FORMULÁRIO DE ENTREGA
  // ============================================================

  await page.goto('/create-delivery.html');

  await expect(page).toHaveTitle('New Delivery Address');

  await fillDeliveryForm(page);


  // ============================================================
  // SALVA O ENDEREÇO
  // ============================================================

  const [deliveryResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === 'http://localhost:8080/customer/delivery' &&
      response.request().method() === 'POST'
    ),

    page.getByRole('button', {
      name: 'Save',
      exact: true,
    }).click(),
  ]);


  // ============================================================
  // VALIDA RESPOSTA DO BACKEND
  // ============================================================

  expect(deliveryResponse.ok()).toBeTruthy();


  // ============================================================
  // VALIDA REDIRECIONAMENTO
  // ============================================================

  await page.waitForURL(/index\.html$/);

  await expect(page).toHaveURL(/index\.html$/);
});
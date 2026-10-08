const { test, expect } = require('@playwright/test');

const chargeData = {
  main: 'false',
  receiver: 'Ana Clara',
  zipCode: '01310100',
  typeResidence: 'Apartment',
  streetType: 'Avenue',
  street: 'Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  observation: 'Billing address',
  city: 'São Paulo',
  state: 'SP',
  country: 'Brazil',
};

async function fillChargeForm(page) {
  await page.getByLabel('Main').selectOption(chargeData.main);

  await page.getByLabel('Receiver').fill(chargeData.receiver);

  await page.getByLabel('Zip code').fill(chargeData.zipCode);

  await page.getByLabel('Type Residence').fill(chargeData.typeResidence);

  await page.getByLabel('Street Type').fill(chargeData.streetType);

  await page.getByLabel('Street Name').fill(chargeData.street);

  await page.getByLabel('Number').fill(chargeData.number);

  await page.getByLabel('Neighborhood').fill(chargeData.neighborhood);

  await page.getByLabel('Additional Info').fill(chargeData.observation);

  await page.getByLabel('City').fill(chargeData.city);

  await page.getByLabel('State').fill(chargeData.state);

  await page.getByLabel('Country').fill(chargeData.country);
}


test('cliente consegue preencher o formulário de cobrança', async ({ page }) => {
  await page.goto('/create-charge.html');

  await expect(page).toHaveTitle('New Billing Address');

  await expect(
    page.getByRole('group', {
      name: 'Add New Billing Address',
    })
  ).toBeVisible();

  await fillChargeForm(page);

  await expect(page.getByLabel('Receiver'))
    .toHaveValue(chargeData.receiver);

  await expect(page.getByLabel('Zip code'))
    .toHaveValue(chargeData.zipCode);

  await expect(page.getByLabel('City'))
    .toHaveValue(chargeData.city);

  await expect(page.getByLabel('Country'))
    .toHaveValue(chargeData.country);
});


test('cliente consegue salvar um endereço de cobrança no backend', async ({ page }) => {

  test.skip(
    process.env.RUN_REAL_CHARGE_CREATION !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_CHARGE_CREATION=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar o cadastro real.'
  );


  // ============================================================
  // LOGIN
  // ============================================================

  await page.goto('/login.html');

  await page.getByLabel('Email')
    .fill(process.env.LOGIN_EMAIL);

  await page.getByLabel('Password')
    .fill(process.env.LOGIN_PASSWORD);

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


  // ============================================================
  // VALIDA LOGIN
  // ============================================================

  await page.waitForURL(/index\.html$/);

  await expect(page).toHaveURL(/index\.html$/);

  await expect(
    page.evaluate(() => localStorage.getItem('token'))
  ).resolves.toBeTruthy();


  // ============================================================
  // ACESSA FORMULÁRIO DE COBRANÇA
  // ============================================================

  await page.goto('/create-charge.html');

  await expect(page).toHaveTitle('New Billing Address');

  await fillChargeForm(page);


  // ============================================================
  // SALVA ENDEREÇO
  // ============================================================

  const [chargeResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === 'http://localhost:8080/customer/charge' &&
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

  expect(chargeResponse.ok()).toBeTruthy();


  // ============================================================
  // VALIDA REDIRECIONAMENTO
  // ============================================================

  await expect(page).toHaveURL(/index\.html$/);
});
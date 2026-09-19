const { test, expect } = require('@playwright/test');

const chargeData = {
  receiver: 'Beatriz Oliveira',

  zipCode: '01310100',

  typeResidence: 'Commercial',

  streetType: 'Avenue',

  street: 'Paulista',

  number: '1500',

  neighborhood: 'Bela Vista',

  observation: 'Billing department',

  city: 'São Paulo',

  state: 'SP',

  country: 'Brazil',
};


async function login(page) {

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

  const token = await page.evaluate(() =>
    localStorage.getItem('token')
  );

  expect(token).toBeTruthy();

  return token;
}


async function fillChargeForm(page) {

  await page.getByLabel('Receiver')
    .fill(chargeData.receiver);

  await page.getByLabel('Zip Code')
    .fill(chargeData.zipCode);

  await page.getByLabel('Residence Type')
    .fill(chargeData.typeResidence);

  await page.getByLabel('Street Type')
    .fill(chargeData.streetType);

  await page.getByLabel('Street Name')
    .fill(chargeData.street);

  await page.getByLabel('Number')
    .fill(chargeData.number);

  await page.getByLabel('Neighborhood')
    .fill(chargeData.neighborhood);

  await page.getByLabel('Additional Info')
    .fill(chargeData.observation);

  await page.getByLabel('City')
    .fill(chargeData.city);

  await page.getByLabel('State')
    .fill(chargeData.state);

  await page.getByLabel('Country')
    .fill(chargeData.country);
}


test('cliente consegue atualizar uma cobrança no backend', async ({ page }) => {

  test.skip(
    process.env.RUN_REAL_CHARGE_UPDATE !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_CHARGE_UPDATE=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar a atualização real.'
  );


  // ============================================================
  // LOGIN
  // ============================================================

  const token = await login(page);


  // ============================================================
  // BUSCA O CLIENTE
  // ============================================================

  const customerResponse = await page.request.get(
    'http://localhost:8080/customer/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  expect(customerResponse.ok()).toBeTruthy();

  const customer = await customerResponse.json();


  // ============================================================
  // PEGA UMA COBRANÇA EXISTENTE
  // ============================================================

  const charge = customer.charges?.[0];

  expect(charge?.id).toBeTruthy();


  // ============================================================
  // ABRE A PÁGINA DE ATUALIZAÇÃO
  // ============================================================

  await page.goto(
    `/update-charge.html?entregaId=${charge.id}`
  );

  await expect(page).toHaveTitle(
    'Update Billing Address'
  );

  await expect(
    page.getByRole('group', {
      name: 'Update Billing',
    })
  ).toBeVisible();


  // ============================================================
  // VALIDA DADOS EXISTENTES
  // ============================================================

  await expect(
    page.getByLabel('Receiver')
  ).toHaveValue(charge.receiver || '');


  // ============================================================
  // ALTERA OS DADOS
  // ============================================================

  await fillChargeForm(page);


  // ============================================================
  // ENVIA UPDATE
  // ============================================================

  const [updateResponse] = await Promise.all([

    page.waitForResponse((response) =>
      response.url() ===
        `http://localhost:8080/customer/charge/${charge.id}` &&
      response.request().method() === 'PUT'
    ),

    page.getByRole('button', {
      name: 'Register',
      exact: true,
    }).click(),

  ]);


  // ============================================================
  // VALIDA RESPOSTA DO BACKEND
  // ============================================================

  expect(updateResponse.ok()).toBeTruthy();


  // ============================================================
  // VALIDA REDIRECIONAMENTO
  // ============================================================

  await expect(page).toHaveURL(/index\.html$/);

});
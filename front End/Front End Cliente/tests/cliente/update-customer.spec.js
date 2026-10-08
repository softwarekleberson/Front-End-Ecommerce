const { test, expect } = require('@playwright/test');

async function login(page) {
  await page.goto('/login.html');

  await page.getByLabel('Email').fill(process.env.LOGIN_EMAIL);
  await page.getByLabel('Password').fill(process.env.LOGIN_PASSWORD);

  const [loginResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === 'http://localhost:8080/auth/login' &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Login', exact: true }).click(),
  ]);

  expect(loginResponse.ok()).toBeTruthy();

  await page.waitForURL(/index\.html$/);
  await expect(page).toHaveURL(/index\.html$/);

  await expect(
    page.evaluate(() => localStorage.getItem('token'))
  ).resolves.toBeTruthy();
}

async function openCustomerForm(page) {
  await page.goto('/update-customer.html');

  await expect(page).toHaveTitle('Update Client');

  await expect(
    page.getByRole('group', { name: 'Personal Information' })
  ).toBeVisible();

  await expect(
    page.getByRole('group', { name: 'Phone' })
  ).toBeVisible();

  await expect(
    page.getByLabel('Name')
  ).not.toHaveValue('');
}

test('cliente consegue abrir e carregar os dados para atualização', async ({ page }) => {
  test.skip(
    !process.env.LOGIN_EMAIL || !process.env.LOGIN_PASSWORD,
    'Defina LOGIN_EMAIL e LOGIN_PASSWORD para executar o teste autenticado.'
  );

  await login(page);
  await openCustomerForm(page);

  await expect(page.getByLabel('Date of Birth')).not.toHaveValue('');
  await expect(page.getByLabel('Area Code:')).not.toHaveValue('');
  await expect(page.locator('#phone')).not.toHaveValue('');
});

test('cliente consegue atualizar os próprios dados no backend', async ({ page }) => {
  const customerData = {
    name: process.env.UPDATE_CUSTOMER_NAME,
    birth: process.env.UPDATE_CUSTOMER_BIRTH,
    ddd: process.env.UPDATE_CUSTOMER_DDD,
    phone: process.env.UPDATE_CUSTOMER_PHONE,
    typePhone: process.env.UPDATE_CUSTOMER_PHONE_TYPE,
  };

  test.skip(
    process.env.RUN_REAL_CUSTOMER_UPDATE !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD ||
      Object.values(customerData).some((value) => !value),
    'Defina RUN_REAL_CUSTOMER_UPDATE=true, LOGIN_EMAIL, LOGIN_PASSWORD e todos os campos UPDATE_CUSTOMER_* para executar a atualização real.'
  );

  await login(page);
  await openCustomerForm(page);

  await page.getByLabel('Name').fill(customerData.name);
  await page.getByLabel('Date of Birth').fill(customerData.birth);
  await page.getByLabel('Area Code:').fill(customerData.ddd);
  await page.getByLabel('Phone:', { exact: true }).fill(customerData.phone);
  await page.getByLabel('Type Phone:').selectOption(customerData.typePhone);

  const [updateResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === 'http://localhost:8080/customer/me' &&
      response.request().method() === 'PUT'
    ),
    page.getByRole('button', { name: 'Register', exact: true }).click(),
  ]);

  expect(updateResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/index\.html$/);
});
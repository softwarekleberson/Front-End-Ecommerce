const { test, expect } = require('@playwright/test');

test('cliente consegue remover uma cobrança pela listagem', async ({ page }) => {

  test.skip(
    process.env.RUN_REAL_CHARGE_DELETION !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_CHARGE_DELETION=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar a remoção real.'
  );

  // Login
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

  const token = await page.evaluate(() =>
    localStorage.getItem('token')
  );

  expect(token).toBeTruthy();

  // Busca os dados atuais do cliente
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

  // Pega a primeira cobrança
  const firstCharge = customer.charges?.[0];

  expect(firstCharge?.id).toBeTruthy();

  // Abre a listagem de cobranças
  await page.goto('/list-charges.html');

  await expect(page).toHaveTitle('Billing');

  await expect(
    page.locator('#user-list')
  ).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Add Billing' })
  ).toBeVisible();

  // Localiza a cobrança
  const chargeCard = page
    .locator('.card')
    .filter({ hasText: firstCharge.receiver })
    .last();

  await expect(chargeCard).toBeVisible();

  const deleteLink = chargeCard.getByRole('link', {
    name: 'Delete',
  });

  await expect(deleteLink).toBeVisible();

  // Aceita a confirmação da exclusão
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  // Executa o DELETE real
  const [deleteResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() ===
        `http://localhost:8080/customer/charge/${firstCharge.id}` &&
      response.request().method() === 'DELETE'
    ),
    deleteLink.click(),
  ]);

  expect(deleteResponse.ok()).toBeTruthy();

  // Confirma no backend que a cobrança foi removida
  await expect.poll(async () => {
    const refreshedCustomerResponse = await page.request.get(
      'http://localhost:8080/customer/me',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(refreshedCustomerResponse.ok()).toBeTruthy();

    const refreshedCustomer =
      await refreshedCustomerResponse.json();

    return (
      refreshedCustomer.charges?.some(
        (charge) => charge.id === firstCharge.id
      ) ?? false
    );
  }).toBe(false);
});
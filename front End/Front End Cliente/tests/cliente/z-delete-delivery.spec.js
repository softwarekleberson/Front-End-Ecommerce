const { test, expect } = require('@playwright/test');

test('cliente consegue remover um endereço de entrega', async ({ page }) => {

  test.skip(
    process.env.RUN_REAL_DELIVERY_DELETION !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_DELIVERY_DELETION=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar a remoção real.'
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

  // Pega o primeiro endereço de entrega
  const delivery = customer.deliveres?.[0];

  expect(delivery?.id).toBeTruthy();

  // Abre a lista de endereços
  await page.goto('/list-deliveries.html');

  const deliveryCard = page
    .locator('.card')
    .filter({ hasText: delivery.receiver })
    .last();

  await expect(deliveryCard).toBeVisible();

  // Aceita o alert/confirm de exclusão
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  // Executa o DELETE real
  const [deleteResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() ===
        `http://localhost:8080/customer/delivery/${delivery.id}` &&
      response.request().method() === 'DELETE'
    ),
    deliveryCard.getByRole('link', { name: 'Delete' }).click(),
  ]);

  expect(deleteResponse.ok()).toBeTruthy();

  // Confirma no backend que o endereço foi removido
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
      refreshedCustomer.deliveres?.some(
        (item) => item.id === delivery.id
      ) ?? false
    );
  }).toBe(false);
});
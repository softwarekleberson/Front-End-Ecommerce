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

  const token = await page.evaluate(() => localStorage.getItem('token'));

  expect(token).toBeTruthy();

  return token;
}

test('cliente consegue atualizar todos os dados de um endereço de entrega no backend', async ({ page }) => {

  test.skip(
    process.env.RUN_REAL_DELIVERY_UPDATE !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_DELIVERY_UPDATE=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar a atualização real.'
  );

  const token = await login(page);

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

  // Novos dados que serão enviados para o backend
  const updatedDelivery = {
    receiver: 'Carlos Oliveira',
    typeResidence: 'Apartment',
    streetType: 'Avenue',
    street: 'Faria Lima',
    number: '1500',
    neighborhood: 'Itaim Bibi',
    observation: 'Leave the package at the reception desk',
    city: 'São Paulo',
    state: 'SP',
    deliveryPhrase: 'Call the receiver before delivery',
    country: 'Brazil',
  };

  // Abre a página de atualização
  await page.goto(
    `/update-delivery.html?entregaId=${delivery.id}`
  );

  await expect(page).toHaveTitle('Update Delivery Address');

  await expect(
    page.getByRole('group', { name: 'Update Delivery' })
  ).toBeVisible();

  // Preenche todos os campos
  await page.getByLabel('Receiver').fill(updatedDelivery.receiver);

  await page
    .getByLabel('Residence Type')
    .fill(updatedDelivery.typeResidence);

  await page
    .getByLabel('Street Type')
    .fill(updatedDelivery.streetType);

  await page
    .getByLabel('Street Name')
    .fill(updatedDelivery.street);

  await page
    .getByLabel('Number')
    .fill(updatedDelivery.number);

  await page
    .getByLabel('Neighborhood')
    .fill(updatedDelivery.neighborhood);

  await page
    .getByLabel('Additional Info')
    .fill(updatedDelivery.observation);

  await page
    .getByLabel('City')
    .fill(updatedDelivery.city);

  await page
    .getByLabel('State')
    .fill(updatedDelivery.state);

  await page
    .getByLabel('Delivery Instructions')
    .fill(updatedDelivery.deliveryPhrase);

  await page
    .getByLabel('Country')
    .fill(updatedDelivery.country);

  // Verifica os valores antes de enviar
  await expect(page.getByLabel('Receiver'))
    .toHaveValue(updatedDelivery.receiver);

  await expect(page.getByLabel('Residence Type'))
    .toHaveValue(updatedDelivery.typeResidence);

  await expect(page.getByLabel('Street Type'))
    .toHaveValue(updatedDelivery.streetType);

  await expect(page.getByLabel('Street Name'))
    .toHaveValue(updatedDelivery.street);

  await expect(page.getByLabel('Number'))
    .toHaveValue(updatedDelivery.number);

  await expect(page.getByLabel('Neighborhood'))
    .toHaveValue(updatedDelivery.neighborhood);

  await expect(page.getByLabel('Additional Info'))
    .toHaveValue(updatedDelivery.observation);

  await expect(page.getByLabel('City'))
    .toHaveValue(updatedDelivery.city);

  await expect(page.getByLabel('State'))
    .toHaveValue(updatedDelivery.state);

  await expect(page.getByLabel('Delivery Instructions'))
    .toHaveValue(updatedDelivery.deliveryPhrase);

  await expect(page.getByLabel('Country'))
    .toHaveValue(updatedDelivery.country);

  // Envia o PUT real para o backend
  const [updateResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() ===
        `http://localhost:8080/customer/delivery/${delivery.id}` &&
      response.request().method() === 'PUT'
    ),
    page.getByRole('button', {
      name: 'Register',
      exact: true,
    }).click(),
  ]);

  expect(updateResponse.ok()).toBeTruthy();

  // O frontend deve voltar para a home
  await expect(page).toHaveURL(/index\.html$/);

  // Consulta novamente o backend para verificar persistência
  const updatedCustomerResponse = await page.request.get(
    'http://localhost:8080/customer/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  expect(updatedCustomerResponse.ok()).toBeTruthy();

  const updatedCustomer = await updatedCustomerResponse.json();

  const updatedDeliveryFromBackend =
    updatedCustomer.deliveres?.find(
      (item) => item.id === delivery.id
    );

  expect(updatedDeliveryFromBackend).toBeTruthy();

  // Confirma que todos os campos foram realmente atualizados
  expect(updatedDeliveryFromBackend.receiver)
    .toBe(updatedDelivery.receiver);

  expect(updatedDeliveryFromBackend.typeResidence)
    .toBe(updatedDelivery.typeResidence);

  expect(updatedDeliveryFromBackend.streetType)
    .toBe(updatedDelivery.streetType);

  expect(updatedDeliveryFromBackend.street)
    .toBe(updatedDelivery.street);

  expect(updatedDeliveryFromBackend.number)
    .toBe(updatedDelivery.number);

  expect(updatedDeliveryFromBackend.neighborhood)
    .toBe(updatedDelivery.neighborhood);

  expect(updatedDeliveryFromBackend.observation)
    .toBe(updatedDelivery.observation);

  expect(updatedDeliveryFromBackend.city)
    .toBe(updatedDelivery.city);

  expect(updatedDeliveryFromBackend.state)
    .toBe(updatedDelivery.state);

  expect(updatedDeliveryFromBackend.deliveryPhrase)
    .toBe(updatedDelivery.deliveryPhrase);

  expect(updatedDeliveryFromBackend.country)
    .toBe(updatedDelivery.country);
});

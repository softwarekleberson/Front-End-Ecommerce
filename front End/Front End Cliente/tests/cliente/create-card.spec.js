const { test, expect } = require('@playwright/test');

const cardData = {
  main: true,
  printedName: 'ANA CLARA SILVA',
  numberCard: '4389354713735672',
  code: '123',
  expirationDate: '2040-12-31',
  flag: 'MASTERCARD',
};

async function fillCardForm(page) {
  await page.getByLabel('Do You Want to Make This the Main Card?').check();
  await page.getByLabel('Name Printed on Card').fill(cardData.printedName);
  await page.getByLabel('Card Number').fill(cardData.numberCard);
  await page.getByLabel('Security Code').fill(cardData.code);
  await page.getByLabel('Expiration Date').fill(cardData.expirationDate);
  await page.getByLabel('Brand').selectOption(cardData.flag);
}

async function login(page) {
  await page.goto('/login.html');
  await page.getByLabel('Email').fill(process.env.LOGIN_EMAIL);
  await page.getByLabel('Password').fill(process.env.LOGIN_PASSWORD);

  const [loginResponse] = await Promise.all([
    page.waitForResponse((request) =>
      request.url() === 'http://localhost:8080/auth/login' &&
      request.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Login', exact: true }).click(),
  ]);

  expect(loginResponse.ok()).toBeTruthy();
  await page.waitForURL(/\/index\.html$/);
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.evaluate(() => localStorage.getItem('token'))).resolves.toBeTruthy();
}

test('cliente consegue preencher o formulário de cartão', async ({ page }) => {
  await page.goto('/create-card.html');

  await expect(page).toHaveTitle('Add New Card');
  await expect(page.getByRole('group', { name: 'Register New Card' })).toBeVisible();

  await fillCardForm(page);

  await expect(page.getByLabel('Name Printed on Card')).toHaveValue(cardData.printedName);
  await expect(page.getByLabel('Card Number')).toHaveValue(cardData.numberCard);
  await expect(page.getByLabel('Security Code')).toHaveValue(cardData.code);
  await expect(page.getByLabel('Expiration Date')).toHaveValue(cardData.expirationDate);
});

test('cliente consegue salvar um cartão no backend', async ({ page }) => {
  test.skip(
    process.env.RUN_REAL_CARD_CREATION !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_CARD_CREATION=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar o cadastro real.'
  );

  await login(page);
  await page.goto('/create-card.html');
  await fillCardForm(page);

  const [cardResponse] = await Promise.all([
    page.waitForResponse((request) =>
      request.url() === 'http://localhost:8080/customer/card' &&
      request.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Register', exact: true }).click(),
  ]);

  expect(cardResponse.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/index\.html$/);
});

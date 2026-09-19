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

test('cliente consegue abrir a alteração de senha após login', async ({ page }) => {
  test.skip(
    !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina LOGIN_EMAIL e LOGIN_PASSWORD para executar o teste autenticado.'
  );

  await login(page);

  await page.goto('/update-password.html');

  await expect(page).toHaveTitle('Change Password');

  await expect(
    page.getByRole('group', { name: 'Update Password' })
  ).toBeVisible();

  await expect(
    page.getByLabel('New Password')
  ).toBeVisible();

  await expect(
    page.getByLabel('Confirm Password')
  ).toBeVisible();

  const password = process.env.NEW_PASSWORD || 'SenhaTemporaria@123';

  await page.getByLabel('New Password').fill(password);
  await page.getByLabel('Confirm Password').fill(password);

  await expect(
    page.getByLabel('New Password')
  ).toHaveValue(password);

  await expect(
    page.getByLabel('Confirm Password')
  ).toHaveValue(password);
});

test('cliente consegue atualizar a senha no backend', async ({ page }) => {
  test.skip(
    process.env.RUN_REAL_PASSWORD_UPDATE !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD ||
      !process.env.NEW_PASSWORD,
    'Defina RUN_REAL_PASSWORD_UPDATE=true, LOGIN_EMAIL, LOGIN_PASSWORD e NEW_PASSWORD para executar a alteração real.'
  );

  await login(page);

  await page.goto('/update-password.html');

  await page.getByLabel('New Password').fill(
    process.env.NEW_PASSWORD
  );

  await page.getByLabel('Confirm Password').fill(
    process.env.NEW_PASSWORD
  );

  const [passwordResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() ===
        'http://localhost:8080/customer/password' &&
      response.request().method() === 'PUT'
    ),
    page.getByRole('button', {
      name: 'Save',
      exact: true,
    }).click(),
  ]);

  expect(passwordResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/index\.html$/);
});
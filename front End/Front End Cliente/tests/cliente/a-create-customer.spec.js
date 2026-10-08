const { test, expect } = require('@playwright/test');

test('cliente consegue preencher o formulário de cadastro', async ({ page }) => {

  await page.goto('/create-customer.html');

  await expect(page).toHaveTitle('Register Client');

  await expect(
    page.getByRole('group', { name: 'Personal Information' })
  ).toBeVisible();

  await expect(
    page.getByRole('group', { name: 'Contact Information' })
  ).toBeVisible();

  await expect(
    page.getByRole('group', { name: 'Password' })
  ).toBeVisible();

  await page.getByLabel('Name').fill('kleberson santos silva');

  await page.getByLabel('Gender').selectOption('MALE');

  await page.getByLabel('Date of Birth').fill('1995-05-20');

  await page.getByLabel('Cpf').fill('123.456.789-04');

  await page.getByLabel('Email').fill('kleberson.santos@example.com');

  await page.getByLabel('Area Code').fill('11');

  await page.getByLabel('Phone', { exact: true }).fill('987654321');

  await page.getByLabel('Phone Type').selectOption('MOBILE');

  await page.getByLabel('Password', { exact: true }).fill('SenhaSegura@123');

  await page.getByLabel('Confirm Password').fill('SenhaSegura@123');

  await expect(page.getByLabel('Name'))
    .toHaveValue('kleberson santos silva');

  await expect(page.getByLabel('Email'))
    .toHaveValue('kleberson.santos@example.com');

  await expect(page.getByLabel('Password', { exact: true }))
    .toHaveValue('SenhaSegura@123');

  await expect(page.getByLabel('Confirm Password'))
    .toHaveValue('SenhaSegura@123');
});


test('cliente consegue cadastrar uma conta no backend', async ({ page }) => {

  test.skip(
    process.env.RUN_REAL_CUSTOMER_REGISTRATION !== 'true',
    'Defina RUN_REAL_CUSTOMER_REGISTRATION=true para executar o cadastro real.'
  );

  const customer = {
    name: process.env.CUSTOMER_NAME,
    gender: process.env.CUSTOMER_GENDER,
    birth: process.env.CUSTOMER_BIRTH,
    cpf: process.env.CUSTOMER_CPF,
    ddd: process.env.CUSTOMER_DDD,
    phone: process.env.CUSTOMER_PHONE,
    typePhone: process.env.CUSTOMER_PHONE_TYPE,
    email: process.env.CUSTOMER_EMAIL,
    password: process.env.CUSTOMER_PASSWORD,
    confirmPassword: process.env.CUSTOMER_CONFIRM_PASSWORD,
  };

  test.skip(
    Object.values(customer).some((value) => !value),
    'Defina todos os campos CUSTOMER_* para executar o cadastro real.'
  );

  await page.goto('/create-customer.html');

  await page.getByLabel('Name').fill(customer.name);

  await page.getByLabel('Gender').selectOption(customer.gender);

  await page.getByLabel('Date of Birth').fill(customer.birth);

  await page.getByLabel('Cpf').fill(customer.cpf);

  await page.getByLabel('Email').fill(customer.email);

  await page.getByLabel('Area Code').fill(customer.ddd);

  await page.getByLabel('Phone', { exact: true }).fill(customer.phone);

  await page.getByLabel('Phone Type').selectOption(customer.typePhone);

  await page.getByLabel('Password', { exact: true })
    .fill(customer.password);

  await page.getByLabel('Confirm Password')
    .fill(customer.confirmPassword);

  const [response] = await Promise.all([

    page.waitForResponse((response) =>
      response.url() === 'http://localhost:8080/auth/customer' &&
      response.request().method() === 'POST'
    ),

    page.getByRole('button', {
      name: 'Register',
      exact: true
    }).click(),

  ]);

  expect(response.ok()).toBeTruthy();

  await expect(page).toHaveURL(/index\.html$/);
});


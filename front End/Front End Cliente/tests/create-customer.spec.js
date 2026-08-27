import { test, expect } from '@playwright/test';

test('Deve cadastrar cliente com sucesso no backend real', async ({ page }) => {
  // Acessa a página correta no Live Server travado na porta 8085
  await page.goto('/create-customer.html');

  const timestamp = Date.now();
  const emailUnico = `cliente_${timestamp}@gmail.com`;

  // Preenche as informações
  await page.getByLabel('Name').fill('Cliente Teste');
  await page.getByLabel('Gender').selectOption('MALE');
  await page.getByLabel('Date of Birth').fill('1995-05-20');
  await page.getByLabel('Cpf').fill('123.456.789-04');

  await page.getByLabel('Email').fill(emailUnico);
  await page.getByLabel('Area Code').fill('11');
  await page.getByLabel('Phone').fill('987654321');
  await page.getByLabel('Phone Type').selectOption('MOBILE');

  await page.getByLabel('Password', { exact: true }).fill('Senha123!');
  await page.getByLabel('Confirm Password').fill('Senha123!');

  // Escuta a requisição da API na porta 8080 e envia o formulário
  const [response] = await Promise.all([
    page.waitForResponse(res => 
      res.url().includes('localhost:8080/auth/customer') && res.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Register' }).click()
  ]);

  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/index\.html$/);
});
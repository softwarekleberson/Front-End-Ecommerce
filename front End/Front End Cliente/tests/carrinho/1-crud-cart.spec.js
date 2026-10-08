import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.LOGIN_EMAIL || 'charle.silva@email.com',
  password: process.env.LOGIN_PASSWORD || 'SenhaSegura@123',
};

test.describe('Fluxo do Carrinho de Compras (E2E)', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Acessa a página de login
    await page.goto('/login.html');

    // 2. Preenche e envia as credenciais de autenticação
    await page.fill('#email', TEST_USER.email);
    await page.fill('#senha', TEST_USER.password);

    const loginPromise = page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.status() === 200
    );

    await page.click('button[type="submit"]');
    await loginPromise;
    await page.waitForURL(/\/index\.html$/);

    // 3. Valida se o Token JWT foi armazenado no LocalStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('Deve carregar o carrinho do usuário autenticado (Read)', async ({ page }) => {
    const cartResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/customer/cart') && res.status() === 200
    );

    await page.goto('/cart.html');
    await cartResponsePromise;

    const tabela = page.locator('table');
    await expect(tabela).toBeVisible();

    const linhasItens = page.locator('table tbody tr');
    await expect(linhasItens.first()).toBeVisible();
  });

  test('Deve exibir alerta de estoque insuficiente ao tentar atualizar para 1000 itens', async ({ page }) => {
    // 1. Carrega a página e aguarda os dados do carrinho
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/customer/cart') && res.status() === 200),
      page.goto('/cart.html')
    ]);

    const primeiraLinha = page.locator('table tbody tr[data-cart-item-id]').first();
    await expect(primeiraLinha).toBeVisible();

    await page.waitForFunction((el) => {
      const resId = el?.getAttribute('data-reservation-id');
      return resId && resId !== 'undefined' && resId.trim() !== '';
    }, await primeiraLinha.elementHandle());

    const inputQuantidade = primeiraLinha.locator('input[type="number"]');
    const quantidadeExcedente = '1000';

    // Variable para verificar se a mensagem exata foi capturada
    let alertMessage = '';

    // Registra o listener do alert antes de alterar o valor
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // 2. Altera a quantidade para 1000 e executa os eventos de blur/enter
    await inputQuantidade.click();
    await inputQuantidade.fill(quantidadeExcedente);
    await inputQuantidade.press('Enter');
    await inputQuantidade.blur();

    // 3. Valida se a mensagem do alert capturado é a esperada
    expect(alertMessage).toContain('Insufficient stock');
  });

  test('adiciona um produto, atualiza a quantidade para 3 e exclui o item', async ({ page }) => {
    test.skip(
      process.env.RUN_REAL_CART_UPDATE_DELETE !== 'true',
      'Defina RUN_REAL_CART_UPDATE_DELETE=true para adicionar, atualizar e remover um item real do carrinho.'
    );

    const productsResponse = await page.request.get('http://localhost:8080/public/product');
    expect(productsResponse.ok()).toBeTruthy();
    const productsPayload = await productsResponse.json();
    const products = productsPayload.content ?? productsPayload;
    const product = products.find((item) => item.category === 'BOOKS' && item.id);
    expect(product, 'A API não retornou produto da categoria BOOKS').toBeTruthy();

    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(`/book-details.html?id=${encodeURIComponent(product.id)}`);

    const [addResponse] = await Promise.all([
      page.waitForResponse((response) =>
        response.url() === 'http://localhost:8080/customer/cart' &&
        response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Add To Cart', exact: true }).click(),
    ]);
    expect(addResponse.ok()).toBeTruthy();
    await page.waitForURL(/\/cart\.html$/);

    const productRow = page.locator('table tbody tr[data-cart-item-id]')
      .filter({ hasText: product.name })
      .last();
    await expect(productRow).toBeVisible();

    const cartItemId = await productRow.getAttribute('data-cart-item-id');
    const quantityInput = productRow.locator('input[type="number"]');
    await page.waitForFunction((row) => {
      const reservationId = row?.getAttribute('data-reservation-id');
      return reservationId && reservationId !== 'undefined' && reservationId.trim() !== '';
    }, await productRow.elementHandle());

    const [updateResponse] = await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes(`/customer/cart/update/${cartItemId}`) &&
        response.request().method() === 'PUT'
      ),
      (async () => {
        await quantityInput.fill('3');
        await quantityInput.press('Enter');
        await quantityInput.blur();
      })(),
    ]);
    expect(updateResponse.ok(), `PUT respondeu HTTP ${updateResponse.status()}`).toBeTruthy();
    await expect(quantityInput).toHaveValue('3');

    await page.waitForFunction((row) => {
      const reservationId = row?.getAttribute('data-reservation-id');
      return reservationId && reservationId !== 'undefined' && reservationId.trim() !== '';
    }, await productRow.elementHandle());

    const [deleteResponse] = await Promise.all([
      page.waitForResponse((response) =>
        response.url() === `http://localhost:8080/customer/cart/item/${cartItemId}` &&
        response.request().method() === 'DELETE'
      ),
      productRow.getByRole('button').click(),
    ]);

    const deleteError = deleteResponse.ok() ? '' : await deleteResponse.text();
    expect(
      deleteResponse.ok(),
      `DELETE respondeu HTTP ${deleteResponse.status()}: ${deleteError}`
    ).toBeTruthy();
    await expect(page.locator(`tr[data-cart-item-id="${cartItemId}"]`)).toHaveCount(0);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    await expect.poll(async () => {
      const response = await page.request.get('http://localhost:8080/customer/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.ok()).toBeTruthy();
      const cart = await response.json();
      return cart.cartItens?.some(
        (item) => String(item.cartItemId) === String(cartItemId)
      ) ?? false;
    }).toBe(false);
  });

});

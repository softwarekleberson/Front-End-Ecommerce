import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080';
const CARD_ID = 'baeda08f-4d4c-4d8b-ad11-48ad995b975a';
const VOUCHER_ID = 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a';

test('cliente adiciona um produto, aumenta para quatro unidades e paga com cartão e cupom', async ({ page }) => {
  test.skip(
    process.env.RUN_REAL_CARD_COUPON_PAYMENT !== 'true' ||
      !process.env.LOGIN_EMAIL ||
      !process.env.LOGIN_PASSWORD,
    'Defina RUN_REAL_CARD_COUPON_PAYMENT=true, LOGIN_EMAIL e LOGIN_PASSWORD para executar o pagamento real.'
  );

  // Login de cliente real.
  await page.goto('/login.html');
  await page.getByLabel('Email').fill(process.env.LOGIN_EMAIL);
  await page.getByLabel('Password').fill(process.env.LOGIN_PASSWORD);

  const [loginResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/auth/login` &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Login', exact: true }).click(),
  ]);

  expect(loginResponse.ok()).toBeTruthy();
  await page.waitForURL(/\/index\.html$/);
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  const authHeaders = { Authorization: `Bearer ${token}` };
  const [customerResponse, vouchersResponse, productsResponse] = await Promise.all([
    page.request.get(`${API_URL}/customer/me`, { headers: authHeaders }),
    page.request.get(`${API_URL}/customer/voucher`, { headers: authHeaders }),
    page.request.get(`${API_URL}/public/product`),
  ]);

  expect(customerResponse.ok()).toBeTruthy();
  expect(vouchersResponse.ok()).toBeTruthy();
  expect(productsResponse.ok()).toBeTruthy();

  const customer = await customerResponse.json();
  expect(
    customer.cards?.some((card) => card.cardId === CARD_ID),
    `Cartão ${CARD_ID} não encontrado na conta do cliente`
  ).toBeTruthy();

  const vouchersPayload = await vouchersResponse.json();
  const vouchers = vouchersPayload.content ?? vouchersPayload;
  expect(
    vouchers.some((voucher) => voucher.voucherId === VOUCHER_ID),
    `Cupom ${VOUCHER_ID} não encontrado para o cliente`
  ).toBeTruthy();

  const productsPayload = await productsResponse.json();
  const products = Array.isArray(productsPayload)
    ? [...productsPayload]
    : [...(productsPayload.content ?? [])];

  // O endpoint é paginado; procura também nas páginas seguintes caso os primeiros
  // produtos já estejam no carrinho do cliente.
  const totalPages = productsPayload.totalPages ?? 1;
  for (let pageNumber = 1; pageNumber < totalPages; pageNumber += 1) {
    const pageResponse = await page.request.get(
      `${API_URL}/public/product?page=${pageNumber}`
    );
    expect(pageResponse.ok(), `Falha ao consultar a página ${pageNumber} do catálogo`).toBeTruthy();
    const pagePayload = await pageResponse.json();
    products.push(...(Array.isArray(pagePayload) ? pagePayload : pagePayload.content ?? []));
  }

  // Captura e aceita os alerts da adição, atualização e pagamento.
  let updateAlertMessage = '';
  page.on('dialog', (dialog) => {
    updateAlertMessage = dialog.message();
    dialog.accept();
  });

  const product = products.find((item) => item.id);
  expect(product, 'O catálogo não retornou nenhum produto').toBeTruthy();

  const cartBeforeAddResponse = await page.request.get(`${API_URL}/customer/cart`, {
    headers: authHeaders,
  });
  expect(cartBeforeAddResponse.ok()).toBeTruthy();
  const cartBeforeAdd = await cartBeforeAddResponse.json();
  const previousItems = cartBeforeAdd.cartItens ?? [];

  // Adiciona uma unidade do produto pelo fluxo normal de cliente.
  const productDetailsPage = product.category === 'BAG' ? 'bag-details.html' : 'book-details.html';
  await page.goto(`/${productDetailsPage}?id=${encodeURIComponent(product.id)}`);
  const [addResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/customer/cart` &&
      response.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Add To Cart', exact: true }).click(),
  ]);
  expect(addResponse.ok()).toBeTruthy();
  await page.waitForURL(/\/cart\.html$/);
  updateAlertMessage = '';

  // Seleciona a linha criada pela adição atual, evitando reutilizar uma reserva
  // antiga que já tenha sido cancelada no backend.
  const cartAfterAddResponse = await page.request.get(`${API_URL}/customer/cart`, {
    headers: authHeaders,
  });
  expect(cartAfterAddResponse.ok()).toBeTruthy();
  const cartAfterAdd = await cartAfterAddResponse.json();
  const freshItem = (cartAfterAdd.cartItens ?? []).find((item) => {
    const oldItem = previousItems.find(
      (previous) => String(previous.cartItemId) === String(item.cartItemId)
    );
    const reservationId = item.reservationId ?? item.reservation_id;
    const oldReservationId = oldItem?.reservationId ?? oldItem?.reservation_id;
    return item.productName === product.name && reservationId &&
      (!oldItem || String(oldReservationId) !== String(reservationId));
  });
  expect(
    freshItem,
    `A API não criou uma nova reserva para ${product.name}; o carrinho ainda pode estar usando uma reserva cancelada.`
  ).toBeTruthy();

  const cartItemId = freshItem.cartItemId;
  const freshReservationId = freshItem.reservationId ?? freshItem.reservation_id;
  const productRow = page.locator(`tr[data-cart-item-id="${cartItemId}"]`);
  await expect(productRow).toBeVisible();
  const quantityInput = productRow.locator('input[type="number"]');
  await page.waitForFunction((row) => {
    const reservationId = row?.getAttribute('data-reservation-id');
    return reservationId && reservationId !== 'undefined' && reservationId.trim() !== '';
  }, await productRow.elementHandle());
  await expect(productRow).toHaveAttribute('data-reservation-id', String(freshReservationId));

  const [quantityResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/customer/cart/update/${cartItemId}` &&
      response.request().method() === 'PUT'
    ),
    (async () => {
      await quantityInput.fill('4');
      await quantityInput.press('Enter');
      await quantityInput.blur();
    })(),
  ]);
  const quantityError = quantityResponse.ok() ? '' : await quantityResponse.text();
  expect(
    quantityResponse.ok(),
    `PUT respondeu HTTP ${quantityResponse.status()}: ${quantityError || updateAlertMessage}`
  ).toBeTruthy();
  await expect(quantityInput).toHaveValue('4');

  await page.goto('/checkout.html');
  await expect(page.locator('#summaryTotal')).not.toHaveText('R$ 0,00');
  const cartTotal = await page.evaluate(() => window.checkoutCartTotal);
  expect(cartTotal).toBeGreaterThanOrEqual(10);

  await page.getByRole('radio', { name: 'Card + Coupon Payment', exact: true }).check();
  const cardSelect = page.locator('#registeredCards');
  await expect(cardSelect.locator(`option[value="${CARD_ID}"]`)).toHaveCount(1);
  await cardSelect.selectOption(CARD_ID);
  await page.locator('#couponCode').fill(VOUCHER_ID);

  const payButton = page.locator('#payButton');
  await expect(payButton).toBeEnabled();

  const [paymentResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url() === `${API_URL}/payment/checkout` &&
      response.request().method() === 'POST'
    ),
    payButton.click(),
  ]);

  expect(paymentResponse.ok(), `API respondeu HTTP ${paymentResponse.status()}`).toBeTruthy();
  expect(paymentResponse.request().postDataJSON()).toMatchObject({
    typePayment: 'VOUCHER_CARD',
    numberCardOne: CARD_ID,
    amountCardOne: expect.any(Number),
    voucherId: VOUCHER_ID,
  });
  expect(paymentResponse.request().postDataJSON().amountCardOne).toBeGreaterThanOrEqual(10);
});

/**
 * Payment Service
 * Serviço responsável por gerenciar as requisições de pagamento ao backend
 */

const PAYMENT_API_URL = 'http://localhost:8080/payment/checkout';

/**
 * Constrói o payload de pagamento baseado no método selecionado
 * @param {string} selectedMethod - Método de pagamento selecionado
 * @param {number} totalAmount - Valor total da compra
 * @param {HTMLSelectElement} cardSelect1 - Select do primeiro cartão
 * @param {HTMLSelectElement} cardSelect2 - Select do segundo cartão (opcional)
 * @param {HTMLSelectElement} amount1Select - Select com o valor do primeiro cartão
 * @param {HTMLInputElement} couponInput - Input com o código do cupom
 * @returns {Object} Payload formatado para a DTO PaymentDetails
 */
function buildPaymentPayload(selectedMethod, totalAmount, cardSelect1, cardSelect2, amount1Select, couponInput) {
    const payload = {};

    switch (selectedMethod) {
        case 'card':
            payload.typePayment = 'CARD';
            payload.numberCardOne = cardSelect1.value;
            payload.amountCardOne = totalAmount;
            break;

        case 'two-cards':
            payload.typePayment = 'TWO_CARDS';
            const amountCard1 = parseFloat(amount1Select?.value || 0);
            const amountCard2 = parseFloat((totalAmount - amountCard1).toFixed(2));

            payload.numberCardOne = cardSelect1.value;
            payload.amountCardOne = amountCard1;
            payload.numberCardTwo = cardSelect2.value;
            payload.amountCardTwo = amountCard2;
            break;

        case 'coupon':
            payload.typePayment = 'VOUCHER';
            payload.voucherId = couponInput.value;
            break;

        case 'card-coupon':
            payload.typePayment = 'VOUCHER_CARD';
            payload.numberCardOne = cardSelect1.value;
            payload.amountCardOne = totalAmount;
            payload.voucherId = couponInput.value;
            break;

        default:
            throw new Error(`Método de pagamento não reconhecido: ${selectedMethod}`);
    }

    return payload;
}

/**
 * Envia a requisição de pagamento ao backend
 * @param {Object} paymentPayload - Payload da DTO PaymentDetails
 * @returns {Promise<Object>} Resposta do servidor
 */
async function submitPaymentRequest(paymentPayload) {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }

    const response = await fetch(PAYMENT_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentPayload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao processar pagamento: ${response.status} - ${errorText}`);
    }

    return response.json();
}

/**
 * Processa o pagamento completo
 * @param {Object} options - Opções de pagamento
 * @returns {Promise<Object>} Resultado da requisição (success/error)
 */
async function processPayment(options) {
    const {
        selectedMethod,
        totalAmount,
        cardSelect1,
        cardSelect2,
        amountInput,
        couponInput
    } = options;

    try {
        const payload = buildPaymentPayload(
            selectedMethod,
            totalAmount,
            cardSelect1,
            cardSelect2,
            amountInput,
            couponInput
        );

        console.log('Enviando payload para backend:', payload);

        const result = await submitPaymentRequest(payload);
        console.log('Resposta do servidor:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Erro na requisição de pagamento:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Exporta as funções para uso global
 */
window.PaymentService = {
    buildPaymentPayload,
    submitPaymentRequest,
    processPayment
};
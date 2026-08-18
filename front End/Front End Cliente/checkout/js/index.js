// Máscaras de input
function maskCardNumber(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = value;
        detectCardType(e.target);
    });
}

function maskExpiry(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0,2) + '/' + value.substring(2,4);
        }
        e.target.value = value;
    });
}

function maskCPF(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });
}

function maskCVV(input) {
    input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
}

// Detecção de tipo de cartão
function detectCardType(input) {
    const value = input.value.replace(/\D/g, '');
    const cardTypeEl = input.parentNode.querySelector('.card-type');
    
    if (!cardTypeEl) return;

    cardTypeEl.textContent = '';
    cardTypeEl.className = 'card-type';

    if (/^4/.test(value)) {
        cardTypeEl.textContent = '✳︎';
        cardTypeEl.classList.add('visa');
    } else if (/^5[1-5]/.test(value)) {
        cardTypeEl.textContent = '✳︎';
        cardTypeEl.classList.add('mastercard');
    } else if (/^3[47]/.test(value)) {
        cardTypeEl.textContent = '✳︎';
        cardTypeEl.classList.add('amex');
    }
}

function formatCurrency(value) {
    return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Inicialização Geral
document.addEventListener('DOMContentLoaded', () => {
    // Aplicar máscaras aos inputs manuais se existirem
    ['cardNumber1', 'cardNumber2'].forEach(id => {
        const input = document.getElementById(id);
        if (input) maskCardNumber(input);
    });

    ['expiry1', 'expiry2'].forEach(id => {
        const input = document.getElementById(id);
        if (input) maskExpiry(input);
    });

    ['cpf1', 'cpf2'].forEach(id => {
        const input = document.getElementById(id);
        if (input) maskCPF(input);
    });

    ['cvv1', 'cvv2'].forEach(id => {
        const input = document.getElementById(id);
        if (input) maskCVV(input);
    });

    // Chamadas de carregamento de contexto (Mock/Backend)
    if (typeof loadCustomerData === 'function') loadCustomerData();
    if (typeof loadCartData === 'function') loadCartData();

    // Mapeamento de Elementos do DOM
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const cardForm = document.getElementById('card-form');
    const couponForm = document.getElementById('coupon-form');
    const twoCardsToggle = document.getElementById('two-cards-toggle');
    const card2 = document.getElementById('card2');
    const registeredCardsSection = document.getElementById('registered-cards-section');
    const card1Manual = document.getElementById('card1');
    const registeredCardsSelect = document.getElementById('registeredCards');
    const registeredCardsSelect2 = document.getElementById('registeredCards2');
    const amount1Select = document.getElementById('amount1Select');
    const amount2Display = document.getElementById('amount2Display');
    const payButton = document.getElementById('payButton');
    const inputs = document.querySelectorAll('.input-field');
    const selects = document.querySelectorAll('select');

    // Escuta a mudança de métodos de pagamento
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === 'card') {
                cardForm.style.display = 'block';
                couponForm.style.display = 'none';
                twoCardsToggle.style.display = 'block';
                card2.classList.remove('active');
                document.getElementById('twoCardsToggle').classList.remove('active');
                registeredCardsSection.style.display = 'block';
                card1Manual.style.display = 'none';
                registeredCardsSelect.value = 'card1';
            } else if (value === 'two-cards') {
                cardForm.style.display = 'block';
                couponForm.style.display = 'none';
                twoCardsToggle.style.display = 'none';
                card2.classList.add('active');
                registeredCardsSection.style.display = 'block';
                card1Manual.style.display = 'none';
                registeredCardsSelect.value = 'card1';
                registeredCardsSelect2.value = 'card2';
                populateTwoCardAmountOptions(window.checkoutCartTotal || 0);
                updateSplitAmounts();
            } else if (value === 'card-coupon') {
                cardForm.style.display = 'block';
                couponForm.style.display = 'block';
                twoCardsToggle.style.display = 'none';
                card2.classList.remove('active');
                document.getElementById('twoCardsToggle').classList.remove('active');
                registeredCardsSection.style.display = 'block';
                card1Manual.style.display = 'none';
                registeredCardsSelect.value = 'card1';
            } else if (value === 'coupon') {
                cardForm.style.display = 'none';
                couponForm.style.display = 'block';
                twoCardsToggle.style.display = 'none';
                card2.classList.remove('active');
                document.getElementById('twoCardsToggle').classList.remove('active');
            }
            validateForm();
        });
    });

    // Comportamento do Switch Alternativo de dois cartões
    const toggle = document.getElementById('twoCardsToggle');
    toggle.addEventListener('click', () => {
        const isActive = card2.classList.toggle('active');
        toggle.classList.toggle('active', isActive);
        if (isActive) {
            amount1Select?.focus();
        }
        validateForm();
    });

    // Simulação local de checagem do cupom
    const applyCouponBtn = document.getElementById('applyCoupon');
    applyCouponBtn.addEventListener('click', () => {
        const couponCode = document.getElementById('couponCode').value.trim();
        if (couponCode) {
            alert('Cupom aplicado com sucesso! (Simulação)\n\n' + `Código: ${couponCode}\n`);
        } else {
            alert('Digite um código de cupom válido.');
        }
    });

    // Redirecionamentos de modais/telas extras
    document.getElementById('addNewCard').addEventListener('click', () => window.open('create-card.html', '_blank'));
    document.getElementById('addNewAddress').addEventListener('click', () => window.open('create-delivery.html', '_blank'));

    // Ouvintes para Validação em Tempo Real
    inputs.forEach(input => {
        input.addEventListener('blur', validateForm);
        input.addEventListener('input', validateForm);
    });

    selects.forEach(select => {
        select.addEventListener('change', validateForm);
    });

    amount1Select?.addEventListener('change', () => {
        updateSplitAmounts();
        validateForm();
    });

    // Divisão Dinâmica de Valores para Dois Cartões
    function populateTwoCardAmountOptions(totalValue) {
        if (!amount1Select) return;
        amount1Select.innerHTML = '<option value="">Selecione um valor</option>';

        const halfValue = Number((totalValue / 2).toFixed(2));
        if (halfValue <= 0) return;

        let step = 1;
        if (halfValue > 100) step = 5;
        if (halfValue > 250) step = 10;

        for (let amount = step; amount <= halfValue; amount += step) {
            const option = document.createElement('option');
            option.value = amount.toFixed(2);
            option.textContent = formatCurrency(amount);
            amount1Select.appendChild(option);
        }

        const lastAmount = parseFloat(amount1Select.options[amount1Select.options.length - 1]?.value || 0);
        if (lastAmount < halfValue) {
            const option = document.createElement('option');
            option.value = halfValue.toFixed(2);
            option.textContent = formatCurrency(halfValue);
            amount1Select.appendChild(option);
        }
    }

    function updateSplitAmounts() {
        const totalValue = window.checkoutCartTotal || 0;
        const amount1 = parseFloat(amount1Select?.value || 0);
        const remaining = totalValue > 0 && amount1 > 0 ? totalValue - amount1 : 0;
        if (amount2Display) {
            amount2Display.textContent = formatCurrency(remaining);
        }
    }

    // Validação do Formulário Alinhada com o Backend
    function validateForm() {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
        let isValid = false;
        const totalValue = window.checkoutCartTotal || 0;
        const isTwoCards = selectedMethod === 'two-cards';

        if (selectedMethod === 'card') {
            isValid = registeredCardsSelect && registeredCardsSelect.value !== '';
        } else if (isTwoCards) {
            const amount1 = parseFloat(amount1Select?.value || 0);
            isValid = registeredCardsSelect && registeredCardsSelect.value !== '' && 
                      registeredCardsSelect2 && registeredCardsSelect2.value !== '' && 
                      amount1 > 0 && amount1 <= totalValue / 2;
        } else if (selectedMethod === 'card-coupon') {
            isValid = registeredCardsSelect && registeredCardsSelect.value !== '' && document.getElementById('couponCode').value.trim() !== '';
        } else if (selectedMethod === 'coupon') {
            isValid = document.getElementById('couponCode').value.trim() !== '';
        }

        const addressValid = validateAddress();

        console.log(`[Validação] Método: ${selectedMethod} | Pagamento Válido: ${isValid} | Endereço Válido: ${addressValid}`);

        payButton.disabled = !(isValid && addressValid);
        payButton.textContent = `Pagar ${formatCurrency(totalValue)}`;
    }

    function validateAddress() {
        const street = document.getElementById('street').value.trim();
        const number = document.getElementById('number').value.trim();
        const neighborhood = document.getElementById('neighborhood').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();

        return street && number && neighborhood && city && state;
    }

    // Processamento e Integração HTTP POST (Spring Boot)
    payButton.addEventListener('click', async () => {
        if (payButton.disabled) return;

        payButton.disabled = true;
        payButton.textContent = 'Processando...';

        const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
        const isTwoCards = selectedMethod === 'two-cards';
        const totalValue = window.checkoutCartTotal || 0;
        const amount1 = isTwoCards ? parseFloat(amount1Select?.value || 0) : totalValue;
        const amount2 = isTwoCards ? Number((totalValue - amount1).toFixed(2)) : 0;

        // Mapeamento explícito para o Enum 'TypePayment' do Domínio do Java
        let typePaymentMapping = '';
        if (selectedMethod === 'card') typePaymentMapping = 'CARD';
        else if (selectedMethod === 'two-cards') typePaymentMapping = 'TWO_CARDS';
        else if (selectedMethod === 'coupon') typePaymentMapping = 'VOUCHER';
        else if (selectedMethod === 'card-coupon') typePaymentMapping = 'VOUCHER_CARD';

        // Payload estruturado exatamente igual ao record 'PaymentDetails' do Java
        const paymentData = {
            typePayment: typePaymentMapping,
            numberCardOne: selectedMethod !== 'coupon' ? registeredCardsSelect.value : null,
            amountCardOne: selectedMethod !== 'coupon' ? amount1 : 0,
            numberCardTwo: isTwoCards ? registeredCardsSelect2.value : null,
            amountCardTwo: isTwoCards ? amount2 : 0,
            voucherId: (selectedMethod === 'card-coupon' || selectedMethod === 'coupon') 
                       ? document.getElementById('couponCode').value.trim() 
                       : null
        };

        console.log('Dados enviados para o backend:', paymentData);

        try {
            const response = await fetch('http://localhost:8080/payment/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Descomente caso use autenticação ativa via JWT no Spring Security:
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(paymentData)
            });

            if (response.ok) {
                alert('✅ Pagamento processado com sucesso pelo backend!');
                payButton.textContent = 'Pagamento Concluído!';
                payButton.style.background = '#00a651';
                window.location.href = 'index.html'; // Redireciona para a página de sucesso
            } else {
                const errorText = await response.text();
                alert(`❌ Erro no backend: ${response.status} - ${errorText}`);
                payButton.disabled = false;
                payButton.textContent = 'Pagar';
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('❌ Não foi possível conectar ao servidor.');
            payButton.disabled = false;
            payButton.textContent = 'Pagar';
        }
    });

    // Configurações de Estado Inicial da Tela
    validateForm();
    registeredCardsSection.style.display = 'block';
    card1Manual.style.display = 'none';
    registeredCardsSelect.value = 'card1';
});
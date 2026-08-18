const CUSTOMER_ME_API_URL = 'http://localhost:8080/customer/me';

function getCheckoutAuthToken() {
    return localStorage.getItem('token');
}

async function fetchCustomerInfo() {
    const token = getCheckoutAuthToken();
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const response = await fetch(CUSTOMER_ME_API_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching customer info: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

function formatCardOption(card, index) {
    const label = card.printedName ? card.printedName : `Cartão ${index + 1}`;
    const numberCard = card.numberCard !== undefined  ? ` - Number Card: **** **** **** ${card.numberCard.toString().slice(-4)}` : '-';    
  return `${label}${numberCard}`;
}

function populateRegisteredCards(cards) {
    const primarySelect = document.getElementById('registeredCards');
    const secondarySelect = document.getElementById('registeredCards2');
    if (!primarySelect || !secondarySelect) return;

    primarySelect.innerHTML = '<option value="">Selecione um cartão</option>';
    secondarySelect.innerHTML = '<option value="">Selecione um cartão</option>';

    cards.forEach((card, index) => {
        const option1 = document.createElement('option');
        option1.value = card.cardId;
        option1.textContent = formatCardOption(card, index);
        primarySelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = card.cardId;
        option2.textContent = formatCardOption(card, index);
        secondarySelect.appendChild(option2);
    });

    const mainCard = cards.find(card => card.main) || cards[0];
    if (mainCard) {
        primarySelect.value = mainCard.cardId;
        secondarySelect.value = cards[1]?.cardId || '';
    }
}

function populateDeliveryAddress(deliveres) {
    if (!Array.isArray(deliveres) || deliveres.length === 0) return;

    const mainDelivery = deliveres.find(delivery => delivery.main) || deliveres[0];
    if (!mainDelivery) return;

    const mapping = {
        street: mainDelivery.street,
        number: mainDelivery.number,
        neighborhood: mainDelivery.neighborhood,
        city: mainDelivery.city,
        state: mainDelivery.state,
        zip: mainDelivery.zipCode
    };

    Object.entries(mapping).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input && value != null) {
            input.value = value;
        }
    });
}

function populateCustomerInfo(customer) {
    if (!customer) return;

    if (customer.deliveres) {
        populateDeliveryAddress(customer.deliveres);
    }

    if (customer.cards) {
        populateRegisteredCards(customer.cards);
    }
}

async function loadCustomerData() {
    try {
        const customer = await fetchCustomerInfo();
        populateCustomerInfo(customer);
    } catch (error) {
        console.error(error);
        alert(error.message || 'Não foi possível carregar as informações do cliente.');
    }
}

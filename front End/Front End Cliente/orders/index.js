const API_URL = 'http://localhost:8080';

// Função para formatar data
function formatDate(dateString) {
    if (!dateString) return 'Data indisponível';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Mapa de conversão de moedas
const currencyMap = {
    'DOLAR': 'USD',
    'DOLLAR': 'USD',
    'REAL': 'BRL',
    'USD': 'USD',
    'BRL': 'BRL',
    'EUR': 'EUR',
    'GBP': 'GBP'
};

// Símbolos de moeda customizados
const currencySymbols = {
    'USD': 'US$',
    'BRL': 'R$',
    'EUR': '€',
    'GBP': '£'
};

// Função para formatar moeda
function formatCurrency(value, currency) {
    try {
        const isoCode = currencyMap[currency?.toUpperCase()] || 'BRL';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: isoCode
        }).format(value);
    } catch (error) {
        const symbol = currencySymbols[currency?.toUpperCase()] || 'R$';
        return symbol + ' ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// Função para buscar orders
async function loadOrders(page = 0, size = 10) {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch(`${API_URL}/customer/orders?page=${page}&size=${size}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) {
            console.error('Erro ao carregar orders:', response.statusText);
            displayError('Erro ao carregar seus pedidos');
            return;
        }

        const data = await response.json();
        console.log('Orders recebidas:', data);
        
        displayOrders(data.content);
        
    } catch (error) {
        console.error('Erro na requisição:', error);
        displayError('Erro ao conectar com o servidor');
    }
}

// Função para exibir as orders
function displayOrders(orders) {
    const mainContainer = document.querySelector('main');
    
    mainContainer.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        mainContainer.innerHTML = '<p style="text-align: center; padding: 50px; font-size: 18px;">Nenhum pedido encontrado</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        mainContainer.appendChild(orderCard);
    });
}

// Função para criar o card de uma order
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    // Leitura do campo 'data' do ListOrdersDto
    const formattedDate = formatDate(order.data);
    const orderReservationIds = (order.itens || [])
        .map(item => item.reservationId || item.reservation_id || item.reservationid)
        .filter(Boolean);
    const primaryReservationId = orderReservationIds[0] || '';
    
    // Header da order
    const headerHTML = `
        <div class="order-header">
            <div class="info-group">
                <span>ORDER PLACED</span>
                <p>${formattedDate}</p>
            </div>
            <div class="info-group">
                <span>TOTAL</span>
                <p>${formatCurrency(order.total, order.currency)}</p>
            </div>
            <div class="info-group">
                <span>ORDER STATUS</span>
                <p>${order.orderStatus || 'Processando'}</p>
            </div>
            <div class="order-id">
                <span>ORDER # ${order.orderId}</span>
            </div>
        </div>
    `;
    
    // Body da order com itens
    let itemsHTML = '<div class="product-content">';
    
    if (order.itens && order.itens.length > 0) {
        order.itens.forEach(item => {
            const itemReservationId = item.reservationId || item.reservation_id || item.reservationid || '';
            itemsHTML += `
                <div class="product-detail">
                    <div class="product-text">
                        <p><strong>Produto:</strong> ${item.productId}</p>
                        <p><strong>Quantidade:</strong> ${item.quantity}</p>
                        <p><strong>Preço Unitário:</strong> ${formatCurrency(item.price, order.currency)}</p>
                        <p><strong>Subtotal:</strong> ${formatCurrency(item.subtotal, order.currency)}</p>
                        <input type="hidden" class="reservation-id" value="${itemReservationId}" data-reservation-id="${itemReservationId}">
                    </div>
                </div>
            `;
        });
    } else {
        itemsHTML += '<p>Nenhum item neste pedido</p>';
    }
    
    itemsHTML += '</div>';
    
    const bodyHTML = `
        <div class="order-body">
            ${itemsHTML}
            <div class="order-actions">
                <button class="btn-white" type="button">Track Package</button>
                <button class="btn-white replacement-btn" type="button" data-reservation-id="${primaryReservationId}">Return or Replace Items</button>
                <button class="btn-white" type="button">Rate the Product</button>
            </div>
        </div>
    `;
    
    card.innerHTML = headerHTML + bodyHTML;

    const replacementButton = card.querySelector('.replacement-btn');

    if (replacementButton) {
        replacementButton.addEventListener('click', () => {
            const reservationId = replacementButton.dataset.reservationId || card.querySelector('.reservation-id')?.value || '';
            const targetUrl = reservationId
                ? `replacement.html?reservationId=${encodeURIComponent(reservationId)}`
                : 'replacement.html';
            window.location.assign(targetUrl);
        });
    }

    return card;
}

// Função para exibir erro
function displayError(message) {
    const mainContainer = document.querySelector('main');
    mainContainer.innerHTML = `<p style="text-align: center; padding: 50px; font-size: 18px; color: red;">${message}</p>`;
}

// Carregar orders quando a página estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
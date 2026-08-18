const CUSTOMER_CART_API_URL = 'http://localhost:8080/customer/cart';

async function fetchCartInfo() {
    const token = getCheckoutAuthToken();
    if (!token) {
        window.location.href = '/login';
    }

    const response = await fetch(CUSTOMER_CART_API_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching cart: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

function formatCurrency(value) {
    return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function createCartItemElement(item) {
    const productItem = document.createElement('div');
    productItem.className = 'product-item';

    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    const name = document.createElement('span');
    name.className = 'product-name';
    name.textContent = item.productName;
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = formatCurrency(item.subtotal);
    productInfo.appendChild(name);
    productInfo.appendChild(price);

    const productDetails = document.createElement('div');
    productDetails.className = 'product-details';
    const unitPrice = document.createElement('span');
    unitPrice.textContent = `Unit Price: ${formatCurrency(item.unitPrice)}`;
    const quantity = document.createElement('span');
    quantity.textContent = `Quantity: ${item.quantity}`;
    productDetails.appendChild(unitPrice);
    productDetails.appendChild(quantity);

    productItem.appendChild(productInfo);
    productItem.appendChild(productDetails);
    return productItem;
}

function populateCartItems(cartItens) {
    const productsList = document.getElementById('products-list');
    if (!productsList) return;
    productsList.innerHTML = '';

    if (!Array.isArray(cartItens) || cartItens.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'product-item';
        emptyMessage.textContent = 'Your cart is empty.';
        productsList.appendChild(emptyMessage);
        return;
    }

    cartItens.forEach(item => {
        productsList.appendChild(createCartItemElement(item));
    });
}

function updateCartSummary(cart) {
    const summaryDescription = document.getElementById('summaryDescription');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTotal = document.getElementById('summaryTotal');
    const payButton = document.getElementById('payButton');

    const itemCount = cart.cartItens?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const totalPrice = cart.totalPrice || 0;

    if (summaryDescription) {
        summaryDescription.textContent = `Subtotal (${itemCount} items)`;
    }
    if (summarySubtotal) {
        summarySubtotal.textContent = formatCurrency(totalPrice);
    }
    if (summaryTotal) {
        summaryTotal.textContent = formatCurrency(totalPrice);
    }
    if (payButton) {
        payButton.textContent = `Pay ${formatCurrency(totalPrice)}`;
    }

    window.checkoutCartTotal = totalPrice;
}

async function loadCartData() {
    try {
        const cart = await fetchCartInfo();
        populateCartItems(cart.cartItens);
        updateCartSummary(cart);
    } catch (error) {
        console.error(error);
        alert(error.message || 'Unable to load cart data.');
    }
}

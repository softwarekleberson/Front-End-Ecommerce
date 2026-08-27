const tableBody = document.getElementById("transit-orders-body");
const totalTransitOrdersElement = document.getElementById("total-transit-orders");

function normalizeCurrencyCode(currency) {
    const value = String(currency ?? "BRL").trim().toUpperCase();
    const map = {
        BRL: "BRL",
        REAL: "BRL",
        USD: "USD",
        DOLAR: "USD",
        USDT: "USD",
        EUR: "EUR",
        EURO: "EUR",
        GBP: "GBP",
        JPY: "JPY",
        YEN: "JPY"
    };

    return map[value] ?? (value.length === 3 ? value : "BRL");
}

function formatCurrency(value, currency) {
    const numericValue = Number(value ?? 0);
    const safeCurrency = normalizeCurrencyCode(currency);

    if (!Number.isFinite(numericValue)) {
        return `0 ${safeCurrency}`;
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: safeCurrency
    }).format(numericValue);
}

function formatItems(items, currency) {
    if (!Array.isArray(items) || items.length === 0) {
        return "No items";
    }

    return items.map((item) => {
        const productId = item?.productId ?? item?.product?.id ?? "-";
        const quantity = item?.quantity ?? item?.qty ?? item?.amount ?? 0;
        return `<div><strong>Product:</strong> ${productId} | <strong>Qty:</strong> ${quantity}</div>`;
    }).join("");
}

function getOrderStatus(order) {
    return String(order.orderStatus ?? order.status ?? "PENDING").trim().toUpperCase();
}

function createOrderRow(order) {
    const currency = normalizeCurrencyCode(order.currency ?? "BRL");
    const items = order.itens ?? order.items ?? [];
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${order.orderId ?? "-"}</td>
        <td>${order.customerId ?? "-"}</td>
        <td>${formatItems(items, currency)}</td>
        <td>${getOrderStatus(order)}</td>
        <td>${formatCurrency(order.total ?? 0, currency)}</td>
        <td>${currency}</td>
        <td><a href="delivered.html" class="delivered-button">Delivered</a></td>
    `;

    return row;
}

function renderOrdersInTransit(orders) {
    const transitOrders = orders.filter((order) => getOrderStatus(order) === "SHIP");

    tableBody.innerHTML = transitOrders.length > 0
        ? ""
        : '<tr><td colspan="7">No orders in transit</td></tr>';

    transitOrders.forEach((order) => tableBody.appendChild(createOrderRow(order)));

    if (totalTransitOrdersElement) {
        totalTransitOrdersElement.innerHTML = `<p>Orders in transit: ${transitOrders.length}</p>`;
    }
}

async function loadOrdersInTransit() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Authentication token not found. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/adm/orders?page=0&size=100", {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        const orders = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        renderOrdersInTransit(orders);
    } catch (error) {
        console.error("Error loading orders in transit:", error);
        tableBody.innerHTML = '<tr><td colspan="7">Error loading orders</td></tr>';
        if (totalTransitOrdersElement) {
            totalTransitOrdersElement.innerHTML = "<p>Orders in transit: 0</p>";
        }
    }
}

window.addEventListener("DOMContentLoaded", loadOrdersInTransit);
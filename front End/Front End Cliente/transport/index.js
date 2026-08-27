const API_URL = 'http://localhost:8080';
const STATUS_STEPS = ['Em separação', 'Em transporte', 'Entregue'];

function escapeHTML(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function formatDate(dateString) {
	if (!dateString) return 'Data indisponível';
	const date = new Date(dateString);
	return Number.isNaN(date.getTime())
		? 'Data indisponível'
		: date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getStepIndex(orderStatus) {
	const status = String(orderStatus || '').toLowerCase();
	if (status.includes('entreg')) return 2;
	if (status.includes('transport') || status.includes('enviado') || status.includes('caminho')) return 1;
	return 0;
}

function getReservationId(item) {
	return item.reservationId || item.reservation_id || item.reservationid || '';
}

function createTransportCard(order) {
	const currentStep = getStepIndex(order.orderStatus);
	const status = STATUS_STEPS[currentStep];
	const items = order.itens || [];
	const itemCount = items.reduce((total, item) => total + Number(item.quantity || 0), 0) || items.length;
	const steps = STATUS_STEPS.map((step, index) => `
		<div class="transport-step ${index < currentStep ? 'is-complete' : ''} ${index === currentStep ? 'is-current' : ''}">
			<span class="transport-step__marker">${index < currentStep ? '&#10003;' : index + 1}</span>
			<span class="transport-step__label">${step}</span>
		</div>
	`).join('');

	const card = document.createElement('article');
	card.className = 'transport-card';
	card.innerHTML = `
		<div class="transport-card__header">
			<div>
				<h2>Pedido #${escapeHTML(order.orderId || 'sem identificação')}</h2>
				<p>Realizado em ${escapeHTML(formatDate(order.data))}</p>
			</div>
			<span class="transport-card__status">${status}</span>
		</div>
		<div class="transport-timeline" aria-label="Status da entrega">
			${steps}
		</div>
		<p class="transport-items">${itemCount || 'Nenhum'} ${itemCount === 1 ? 'item' : 'itens'} neste pedido</p>
	`;
	return card;
}

async function loadTransport() {
	const container = document.querySelector('#transport-container');
	const token = localStorage.getItem('token');
	const params = new URLSearchParams(window.location.search);
	const requestedOrderId = params.get('orderId');
	const requestedReservationId = params.get('reservationId');

	if (!token) {
		window.location.href = '/login.html';
		return;
	}

	try {
		const response = await fetch(`${API_URL}/customer/orders?page=0&size=20`, {
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		});

		if (response.status === 401) {
			localStorage.removeItem('token');
			window.location.href = '/login.html';
			return;
		}
		if (!response.ok) throw new Error('Não foi possível carregar os pedidos.');

		const data = await response.json();
		let orders = data.content || [];
		if (requestedOrderId) {
			orders = orders.filter(order => String(order.orderId) === requestedOrderId);
		}
		if (requestedReservationId) {
			orders = orders.map(order => ({
				...order,
				itens: (order.itens || []).filter(item => String(getReservationId(item)) === requestedReservationId)
			}));
		}
		container.innerHTML = `
			<div class="transport-page__heading">
				<h1>Acompanhe seus pedidos</h1>
				<p>Veja em que etapa está cada item da sua compra.</p>
			</div>
		`;
		if (!orders.length) {
			container.insertAdjacentHTML('beforeend', '<div class="transport-empty">Você ainda não possui pedidos para acompanhar.</div>');
			return;
		}
		orders.forEach(order => container.appendChild(createTransportCard(order)));
	} catch (error) {
		console.error('Erro ao carregar transporte:', error);
		container.innerHTML = '<div class="transport-error">Não foi possível carregar o acompanhamento agora.</div>';
	}
}

document.addEventListener('DOMContentLoaded', loadTransport);

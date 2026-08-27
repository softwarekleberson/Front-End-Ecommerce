const API_URL = 'http://localhost:8080';

function showStatus(message, isError = false) {
    const status = document.getElementById('formStatus');
    if (!status) return;

    status.textContent = message;
    status.style.color = isError ? '#b42318' : '#1f7a1f';
    status.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const form = document.getElementById('replacementForm');

    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const reservationInput = document.getElementById('reservationId');
    const customerIdInput = document.getElementById('customerId');
    const quantityInput = document.getElementById('quantity');
    const params = new URLSearchParams(window.location.search);
    const reservationFromUrl = params.get('reservationId');
    const purchasedQuantity = Number(sessionStorage.getItem('replacementQuantity'));
    if (reservationFromUrl && reservationInput) {
        reservationInput.value = reservationFromUrl;
    }
    if (customerIdInput) customerIdInput.value = sessionStorage.getItem('replacementCustomerId') || '';
    if (quantityInput) {
        quantityInput.value = Number.isInteger(purchasedQuantity) && purchasedQuantity > 0
            ? purchasedQuantity
            : '';
        if (Number.isInteger(purchasedQuantity) && purchasedQuantity > 0) {
            quantityInput.max = purchasedQuantity;
        }
    }

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const reservationId = document.getElementById('reservationId')?.value.trim();
        const customerId = customerIdInput?.value.trim();
        const quantity = Number(quantityInput?.value);
        const reason = document.getElementById('reason')?.value;
        const explain = document.getElementById('explain')?.value.trim();

        if (!reservationId || !customerId || !Number.isInteger(quantity) || quantity < 1 || !reason || !explain) {
            showStatus('Please fill in all fields before submitting.', true);
            return;
        }

        if (Number.isInteger(purchasedQuantity) && quantity > purchasedQuantity) {
            showStatus(`The replacement quantity cannot exceed the purchased quantity (${purchasedQuantity}).`, true);
            return;
        }

        const payload = {
            reservationId,
            customerId,
            quantity,
            reason,
            explain
        };

        try {
            const response = await fetch(`${API_URL}/customer/replacement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }

            if (response.ok || response.status === 204) {
                showStatus('Request submitted successfully.');
                form.reset();

                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 1200);
                return;
            }

            let errorMessage = 'Unable to submit the replacement request.';
            try {
                const errorData = await response.json();
                if (errorData?.message) errorMessage = errorData.message;
                else if (Array.isArray(errorData?.errors)) errorMessage = errorData.errors.join(', ');
            } catch (error) {
                // Ignore JSON parse errors and use default message.
            }

            showStatus(errorMessage, true);
        } catch (error) {
            console.error('Replacement request error:', error);
            showStatus('Unable to connect to the server. Please try again.', true);
        }
    });
});

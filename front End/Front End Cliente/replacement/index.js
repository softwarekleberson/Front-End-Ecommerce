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
    const params = new URLSearchParams(window.location.search);
    const reservationFromUrl = params.get('reservationId');
    if (reservationFromUrl && reservationInput) {
        reservationInput.value = reservationFromUrl;
    }

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const reservationId = document.getElementById('reservationId')?.value.trim();
        const reason = document.getElementById('reason')?.value;
        const explain = document.getElementById('explain')?.value.trim();

        if (!reservationId || !reason || !explain) {
            showStatus('Please fill in all fields before submitting.', true);
            return;
        }

        const payload = {
            reservationId,
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

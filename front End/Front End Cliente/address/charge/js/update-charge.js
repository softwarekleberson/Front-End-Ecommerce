document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form');

    const params = new URLSearchParams(window.location.search);
    const entregaId = params.get('entregaId'); 

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const formData = {
            receiver: document.getElementById('receiver').value,
            zipCode: document.getElementById('zipCode').value,
            typeResidence: document.getElementById('typeResidence').value,
            streetType: document.getElementById('streetType').value,
            street: document.getElementById('street').value,
            number: document.getElementById('number').value,
            neighborhood: document.getElementById('neighborhood').value,
            observation: document.getElementById('observation').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            country: document.getElementById('country').value,
        };

        try {
            const response = await fetch(`http://localhost:8080/customer/charge/${entregaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                let message = 'Error updating billing.';
                try {
                    const errorData = await response.json();
                    message = errorData.message || errorData.error || message;
                } catch {

                }
                throw new Error(message);
            }

            alert('Billing updated successfully!');
            form.reset();
            window.location.href = '/index.html';

        } catch (error) {
            console.error('Error updating billing:', error);
            alert(error.message || 'Failed to update billing. Please check your data.');
            window.location.href = '/login.html';
        }
    });
});

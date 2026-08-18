document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form');

    // Pega o parâmetro de entrega na URL
    const params = new URLSearchParams(window.location.search);
    const entregaId = params.get('entregaId');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const token = localStorage.getItem('token');

        if (!token) {
            alert('User not authenticated. Please log in again.');
            window.location.href = "/login.html";
            return;
        }

        // 🧾 Cria o objeto com os dados do formulário
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
            deliveryPhrase: document.getElementById('deliveryPhrase').value,
            country: document.getElementById('country').value
        };

        try {
            // 🔗 Faz a requisição PUT com o token JWT
            const response = await fetch(`http://localhost:8080/customer/delivery/${entregaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // ✅ Token JWT
                },
                body: JSON.stringify(formData)
            });

            // 🚨 Verifica se deu erro
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error updating delivery.: ${response.status} - ${errorText}`);
            }

            alert('Delivery updated successfully.!');
            form.reset();
            window.location.href = "/index.html";

        } catch (error) {
            console.error('Error updating delivery.:', error);
            alert('Failed to update delivery. Please check your details or login.');
        }
    });
});

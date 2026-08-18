document.addEventListener('DOMContentLoaded', function () {
    const userList = document.getElementById('user-list');

    async function carregarEntregas() {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login.html";
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/customer/me`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("token");
                    window.location.href = "/login.html";
                    return;
                }
                throw new Error('Error loading deliveries: ' + response.statusText);
            }

            const data = await response.json();
            userList.innerHTML = '';

            // Card fixo para adicionar nova entrega
            const cardFixo = document.createElement('div');
            cardFixo.classList.add('card');

            const addLink = document.createElement('a');
            addLink.classList.add('link');
            addLink.href = `create-delivery.html`;
            addLink.textContent = 'Add Delivery';

            const actionsDivFixo = document.createElement('div');
            actionsDivFixo.classList.add('actions');
            actionsDivFixo.appendChild(addLink);

            cardFixo.appendChild(document.createElement('h2')).textContent = 'Add a new delivery';
            cardFixo.appendChild(actionsDivFixo);
            userList.appendChild(cardFixo);

            // Renderiza as entregas
            // Renderiza as entregas
            if (Array.isArray(data.deliveres)) {
                data.deliveres.forEach(entrega => {
                    const div = document.createElement('div');
                    div.classList.add('card');

                    div.innerHTML = `
            <h3>${entrega.receiver}</h3>
            <p>${entrega.streetType} ${entrega.street}, ${entrega.number}</p>
            <p>${entrega.neighborhood} - ${entrega.city}/${entrega.state}</p>
            <p>ZIP: ${entrega.zipCode}</p>
            <p>${entrega.country}</p>
            <p>${entrega.typeResidence} ${entrega.observation ?? ''}</p>
        `;

                    // Ações (editar/deletar)
                    const actionsDiv = document.createElement('div');
                    actionsDiv.classList.add('actions');

                    // Edit
                    const editLink = document.createElement('a');
                    editLink.href = `update-delivery.html?entregaId=${entrega.id}`;
                    editLink.textContent = "Edit";

                    // Delete
                    const deleteLink = document.createElement('a');
                    deleteLink.href = "#";
                    deleteLink.textContent = "Delete";
                    deleteLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        excluirEntrega(entrega.id);
                    });

                    // Monta ações
                    const separator = document.createElement('span');
                    separator.textContent = " | ";
                    actionsDiv.appendChild(editLink);
                    actionsDiv.appendChild(separator);
                    actionsDiv.appendChild(deleteLink);

                    div.appendChild(actionsDiv);
                    userList.appendChild(div);
                });
            } else {
                console.warn('Unexpected data format:', data);
            }


        } catch (error) {
            console.error("Error loading deliveries:", error);
            alert("Failed to load deliveries. Please try again.");
        }
    }

    carregarEntregas();
});

async function excluirEntrega(entregaId) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    if (confirm("Are you sure you want to delete this delivery?")) {
        try {
            const response = await fetch(`http://localhost:8080/customer/delivery/${entregaId}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("token");
                    window.location.href = "/login.html";
                    return;
                }
                throw new Error('Error deleting delivery: ' + response.statusText);
            }

            alert("Delivery deleted successfully!");
            location.reload();

        } catch (error) {
            console.error("Error deleting delivery:", error);
            alert("This delivery address is being used in an order or cannot be deleted.");
        }
    }
}

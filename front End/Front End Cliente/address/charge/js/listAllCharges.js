document.addEventListener('DOMContentLoaded', function () {
    const userList = document.getElementById('user-list');
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    async function carregarCobrancas() {
        try {
            const response = await fetch(`http://localhost:8080/customer/me`, {
                method: 'GET',
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("Server response:", response.status, text);
                throw new Error('Error loading billing: ' + response.statusText);
            }

            const data = await response.json();
            userList.innerHTML = '';

            // Card fixo para adicionar nova cobrança
            const cardFixo = document.createElement('div');
            cardFixo.classList.add('card');
            cardFixo.innerHTML = `
                <h2>Add Billing</h2>
                <div class="actions">
                    <a class="link" href="create-charge.html">Add</a>
                </div>
            `;
            userList.appendChild(cardFixo);

            // Verifica se há cobranças
            if (Array.isArray(data.charges) && data.charges.length > 0) {
                data.charges.forEach(cobranca => {
                    const div = document.createElement('div');
                    div.classList.add('card');

                    div.innerHTML = `
                        <h3>${cobranca.receiver}</h3>
                        <p>${cobranca.street}</p>
                        <p>${cobranca.typeResidence} - ${cobranca.number} ${cobranca.observation ?? ''}</p>
                        <p>${cobranca.city}, ${cobranca.state} ${cobranca.zipCode}</p>
                        <p>${cobranca.country}</p>
                    `;

                    const actionsDiv = document.createElement('div');
                    actionsDiv.classList.add('actions');

                    // Botão Delete
                    const deleteLink = document.createElement('a');
                    deleteLink.href = "#";
                    deleteLink.textContent = "Delete";
                    deleteLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        excluirCobranca(cobranca.id);
                    });

                    // Separador
                    const separator = document.createElement('span');
                    separator.textContent = " | ";

                    // Botão Edit
                    const editLink = document.createElement('a');
                    editLink.href = `update-charge.html?entregaId=${cobranca.id}`;
                    editLink.textContent = "Edit";

                    actionsDiv.appendChild(deleteLink);
                    actionsDiv.appendChild(separator);
                    actionsDiv.appendChild(editLink);

                    div.appendChild(actionsDiv);
                    userList.appendChild(div);
                });
            } else {
                const emptyMsg = document.createElement('p');
                userList.appendChild(emptyMsg);
            }

        } catch (error) {
            console.error("Error loading billing:", error);
            alert("Failed to load billing information.");
        }
    }

    carregarCobrancas();
});

async function excluirCobranca(idCobranca) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (confirm("Are you sure you want to delete this billing?")) {
        try {
            const response = await fetch(`http://localhost:8080/customer/charge/${idCobranca}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("Delete response:", response.status, text);
                alert("Failed to delete billing.");
                return;
            }

            alert("Billing deleted successfully!");
            location.reload();

        } catch (error) {
            console.error("Error deleting billing:", error);
            alert("Error deleting billing. Please try again.");
        }
    }
}

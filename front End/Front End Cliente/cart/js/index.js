document.addEventListener("DOMContentLoaded", async () => {
    const tabelaCorpo = document.querySelector("table");
    const valorSubtotal = document.querySelector(".valor-subtotal");
    const valorTotal = document.querySelector(".valor-total");

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/customer/cart", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (!response.ok) throw new Error("Failed to fetch cart");

        const cartData = await response.json();

        // Inicializa a renderização passando a lista de itens correta
        renderizarItens(cartData.cartItens, tabelaCorpo);
        atualizarResumo(cartData, valorSubtotal, valorTotal);

    } catch (error) {
        console.error("Erro ao carregar o carrinho:", error);
    }
});

function renderizarItens(itens, tabela) {
    let html = `
        <thead>
            <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>`;

    if (!itens || itens.length === 0) {
        html += `<tr><td colspan="5" style="text-align:center; padding: 20px;">Your cart is empty.</td></tr>`;
    } else {
        itens.forEach(item => {
            // GARANTIA: Captura o reservationId independente de variações do Jackson
            const resId = item.reservationId || item.reservation_id || "";

            html += `
                <tr data-cart-item-id="${item.cartItemId}" data-reservation-id="${resId}">
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${item.urlProduct}" alt="${item.productName}" style="width: 50px; border-radius: 4px;">
                            <span>${item.productName}</span>
                        </div>
                    </td>
                    <td>
                        <input type="number" value="${item.quantity}" min="1" 
                               onchange="atualizarQuantidade(this)" 
                               style="width: 50px; text-align: center;">
                    </td>
                    <td>${item.coin === "REAL" || item.coin === "BRL" ? "R$" : "$"} ${item.unitPrice.toFixed(2)}</td>
                    <td class="item-subtotal">${item.coin === "REAL" || item.coin === "BRL" ? "R$" : "$"} ${item.subtotal.toFixed(2)}</td>
                    <td>
                        <button onclick="removerItem(this)" style="color: red; cursor: pointer; border: none; background: none;">
                            🗑️ 
                        </button>
                    </td>
                </tr>`;
        });
    }

    html += `</tbody>`;
    tabela.innerHTML = html;
}

// --- FUNÇÕES DE AÇÃO (DELETE E UPDATE) ---

async function removerItem(botao) {
    const linha = botao.closest('tr');
    const cartItemId = linha.dataset.cartItemId;
    const reservationId = linha.dataset.reservationId;

    if (!confirm("Remove this item from cart?")) return;

    try {
        const response = await fetch(`http://localhost:8080/customer/cart/item/${cartItemId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reservationId: reservationId })
        });

        if (response.ok) {
            linha.remove();
            alert("Item removed!");
            
            const tabelaCorpo = document.querySelector("table tbody");
            if (tabelaCorpo && tabelaCorpo.children.length === 0) {
                tabelaCorpo.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Your cart is empty.</td></tr>`;
                document.querySelector(".valor-subtotal").textContent = "R$ 0.00";
                document.querySelector(".valor-total").textContent = "R$ 0.00";
            } else {
                window.location.reload();
            }
        } else {
            alert("Error removing item.");
        }
    } catch (error) {
        console.error("Delete error:", error);
    }
}

async function atualizarQuantidade(input) {
    const linha = input.closest('tr');
    const cartItemId = linha.dataset.cartItemId;
    
    // Tenta ler o ID de ambas as formas para evitar falhas de leitura do DOM
    let reservationId = linha.dataset.reservationId; 
    if (!reservationId || reservationId === "undefined") {
        reservationId = linha.getAttribute('data-reservation-id');
    }

    const novaQuantidade = parseInt(input.value);

    // VALIDAÇÃO CRÍTICA: Bloqueia o envio se o ID sumiu por qualquer motivo, evitando o Erro 400
    if (!reservationId || reservationId === "undefined" || reservationId.trim() === "") {
        console.error("Erro no Frontend: O reservationId está indefinido ou vazio. Requisição cancelada.");
        alert("Reserve not found. Reload this page.");
        return;
    }

    const corpoRequisicao = {
        reservationId: reservationId,
        quantity: novaQuantidade
    };

    console.log("Enviando dados para o Java:", corpoRequisicao);

    try {
        const response = await fetch(`http://localhost:8080/customer/cart/update/${cartItemId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(corpoRequisicao)
        });

        if (response.ok) {
            const cartData = await response.json(); 
            console.log("Retorno do Servidor (CartDto):", cartData);

            // Mapeia a lista dinamicamente para suportar variações de escrita do Jackson
            const itens = cartData.cartItens || cartData.listCartItensDto || cartData.cartitens || [];
            const itemAtualizado = itens.find(item => item.cartItemId === cartItemId);
            
            if (itemAtualizado) {
                const novoId = itemAtualizado.reservationId || itemAtualizado.reservation_id;
                
                if (novoId) {
                    // Sincroniza o HTML imediatamente para o próximo clique possuir o ID novo
                    linha.dataset.reservationId = novoId;
                    linha.setAttribute('data-reservation-id', novoId);
                    console.log(`Sincronizado com sucesso! Novo ID gravado no HTML: ${novoId}`);
                }

                const moedaSimbolo = itemAtualizado.coin === "REAL" || itemAtualizado.coin === "BRL" ? "R$" : "$";
                linha.querySelector('.item-subtotal').textContent = `${moedaSimbolo} ${parseFloat(itemAtualizado.subtotal).toFixed(2)}`;
            }
            
            atualizarResumo(cartData, document.querySelector(".valor-subtotal"), document.querySelector(".valor-total"));

        } else {
            const errorData = await response.json();
            console.error("Erro retornado pelo Spring Boot:", errorData);
            alert(errorData.message || "Error updating quantity.");
        }
    } catch (error) {
        console.error("Erro na comunicação com o servidor:", error);
    }
}

function atualizarResumo(cart, subtotalElement, totalElement) {
    const moeda = cart.coin === "REAL" || cart.coin === "BRL" ? "R$" : "$";
    
    // Trata caso o preço total venha encapsulado em um objeto ou direto como número
    const precoBruto = cart.totalPrice?.price !== undefined ? cart.totalPrice.price : cart.totalPrice;
    const preco = parseFloat(precoBruto).toFixed(2);

    if (subtotalElement) subtotalElement.textContent = `${moeda} ${preco}`;
    if (totalElement) totalElement.textContent = `${moeda} ${preco}`;
}
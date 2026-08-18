// details/js/cart/index-book.js

document.getElementById('add-to-cart').addEventListener('click', async (event) => {
    event.preventDefault();

    // 1. Captura o productId da URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id'); 

    if (!productId) {
        alert("Product ID is missing from the URL.");
        return;
    }

    // 2. Recupera o Token de Autenticação
    const token = localStorage.getItem('token'); 

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    // 3. Estrutura os dados (Quantidade fixa em 1 conforme solicitado)
    const requestData = {
        productId: productId,
        quantity: 1
    };

    try {
        // 4. Envio para o servidor (Backend)
        const response = await fetch('http://localhost:8080/customer/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            // --- LÓGICA DO LOCAL STORAGE ---
            // Salva localmente para persistência rápida/offline ou uso na página de checkout
            let localCart = JSON.parse(localStorage.getItem('cart')) || [];
            
            // Verifica se o item já existe na lista local para não duplicar IDs
            const exists = localCart.some(item => item.productId === productId);
            
            if (!exists) {
                localCart.push(requestData);
                localStorage.setItem('cart', JSON.stringify(localCart));
            }
            // -------------------------------

            alert("Item successfully added to your cart!");
            window.location.href = "/cart.html";

        } else if (response.status === 401) {
            localStorage.removeItem('token'); 
            window.location.href = "/login.html";
        } else {
            const errorResponse = await response.json();
            alert("Error: " + (errorResponse.message || "Could not add item to cart."));
        }
    } catch (error) {
        console.error("Network error:", error);
        alert("Server connection failed. Please try again later.");
    }
});
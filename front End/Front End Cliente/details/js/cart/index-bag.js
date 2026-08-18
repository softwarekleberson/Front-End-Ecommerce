document.querySelector('.add-to-cart').addEventListener('click', async (event) => {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id'); 

    if (!productId) {
        alert("Product ID is missing from the URL.");
        return;
    }

    const token = localStorage.getItem('token'); 
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const requestData = {
        productId: productId,
        quantity: 1
    };

    try {

        const response = await fetch('http://localhost:8080/customer/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            let localCart = JSON.parse(localStorage.getItem('cart')) || [];
            
            const exists = localCart.some(item => item.productId === productId);
            
            if (!exists) {
                localCart.push(requestData);
                localStorage.setItem('cart', JSON.stringify(localCart));
            }

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
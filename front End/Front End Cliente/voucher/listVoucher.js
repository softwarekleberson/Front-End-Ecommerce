document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(".container");

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            container.innerHTML = `<p style="color:red;">User not authenticated 😢</p>`;
            window.location.href = "/login.html";
            return;
        }

        const response = await fetch(`http://localhost:8080/customer/voucher`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // 🔥 Token JWT incluído
            },
        });

        if (!response.ok) {
            throw new Error(`Request error: ${response.status} - ${response.statusText}`);
        }

        // Como o Spring retorna um PageResponse, pegamos o objeto completo primeiro
        const responseData = await response.json();
        
        // Extrai a lista de dentro de 'content'. Se não existir, tenta ler como array direto
        const vouchers = responseData.content || responseData;

        if (!vouchers || !Array.isArray(vouchers) || vouchers.length === 0) {
            container.innerHTML = `<p>No vouchers found 🎟️</p>`;
            return;
        }

        // Limpa o container antes de renderizar (boa prática)
        container.innerHTML = "";

        vouchers.forEach((voucher) => {
            const voucherDiv = document.createElement("div");
            voucherDiv.classList.add("voucher-item");
            voucherDiv.innerHTML = `
                <h4>ID: ${voucher.voucherId}</h4>
                <p>Message: ${voucher.message}</p>
                <p>Type: ${voucher.typeVoucher}</p>
                <h4>$ ${voucher.discount} Dólares</h4>
            `;
            container.appendChild(voucherDiv);
        });
    } catch (error) {
        console.error("Error loading vouchers:", error);
        container.innerHTML = `<p style="color:red;">Error loading vouchers 😢</p>`;
    }
});
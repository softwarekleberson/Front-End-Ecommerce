document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const deliveryId = params.get("entregaId");

    // 🔐 Recupera o token salvo após o login
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Session expired. Please log in again.");
        window.location.href = "login.html";
        return;
    }

    try {
        // ✅ Busca os dados do cliente autenticado
        const response = await fetch("http://localhost:8080/customer/me", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert("Session expired. Please log in again.");
                localStorage.removeItem("token");
                window.location.href = "login.html";
                return;
            }
            throw new Error("Error retrieving customer data.");
        }

        const customer = await response.json();
        const deliveries = customer.deliveres || [];

        // 🔍 Localiza a entrega a ser editada
        const delivery = deliveries.find(d => d.id == deliveryId);

        if (!delivery) {
            alert("Delivery address not found.");
            return;
        }

        // 🧾 Preenche o formulário com os dados da entrega
        document.getElementById("receiver").value = delivery.receiver || "";
        document.getElementById("zipCode").value = delivery.zipCode || "";
        document.getElementById("typeResidence").value = delivery.typeResidence || "";
        document.getElementById("streetType").value = delivery.streetType || "";
        document.getElementById("street").value = delivery.street || "";
        document.getElementById("number").value = delivery.number || "";
        document.getElementById("neighborhood").value = delivery.neighborhood || "";
        document.getElementById("observation").value = delivery.observation || "";
        document.getElementById("city").value = delivery.city || "";
        document.getElementById("state").value = delivery.state || "";
        document.getElementById("deliveryPhrase").value = delivery.deliveryPhrase || "";
        document.getElementById("country").value = delivery.country || "";

    } catch (err) {
        console.error("Error loading deliveries:", err);
        alert("We were unable to load the deliveries. Please try again later.");
        window.location.href = "login.html";
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const deliveryId = params.get("entregaId");

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Usuário não autenticado. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const response = await fetch(`http://localhost:8080/customer/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch customer data");
        }

        const customer = await response.json();
        const charges = customer.charges || [];
        const delivery = charges.find(d => d.id == deliveryId); // usa == pois deliveryId vem como string

        if (!delivery) {
            alert("Billing not found.");
            return;
        }

        // Preenche os campos do formulário
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
        document.getElementById("country").value = delivery.country || "";

        // Preenche o campo "main"
        const mainSelect = document.getElementById("main");
        if (mainSelect && typeof delivery.main === "boolean") {
            mainSelect.value = delivery.main ? "true" : "false";
        }

    } catch (err) {
        console.error(err);
        alert("Error loading customer billing.");
        window.location.href = "login.html";
    }
});

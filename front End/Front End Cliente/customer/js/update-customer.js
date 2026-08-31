document.getElementById("form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const formData = {
        name: document.getElementById("name").value,
        birth: document.getElementById("birth").value,
        ddd: document.getElementById("ddd").value,
        phone: document.getElementById("phone").value,
        typePhone: document.getElementById("typePhone").value
    };

    try {
        const response = await fetch("http://localhost:8080/customer/me", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            // Se o problema for falta ou expiração de credencial, limpa e redireciona
            if (response.status === 403 || response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login.html";
                return;
            }

            let errorMsg = "Error updating customer.";
            try {
                const error = await response.json();
                errorMsg = error.message || error.error || errorMsg;
            } catch {
                const text = await response.text();
                if (text) errorMsg = text;
            }

            throw new Error(errorMsg);
        }

        alert("Customer updated successfully!");
        document.getElementById("form").reset();
        window.location.href = "/index.html";

    } catch (error) {
        console.error("Error updating customer:", error);
        // Exibe o alerta com o erro e mantém o usuário na página atual
        alert(error.message || "Unable to update customer.");
    }
});
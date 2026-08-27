document.getElementById("form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const formData = {
        receiver: document.getElementById("receiver").value,
        zipCode: document.getElementById("zipCode").value,
        typeResidence: document.getElementById("typeResidence").value,
        streetType: document.getElementById("streetType").value,
        street: document.getElementById("street").value,
        number: document.getElementById("number").value,
        neighborhood: document.getElementById("neighborhood").value,
        observation: document.getElementById("observation").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        country: document.getElementById("country").value,
        deliveryPhrase: document.getElementById("deliveryPhrase").value,
        main: document.getElementById("main").value === "true" // transforma o valor do select em booleano
    };

    // Validação básica
    if (!formData.receiver || !formData.zipCode || !formData.city || !formData.state || !formData.street) {
        alert("Please fill in all required fields.");
        return;
    }

    const submitBtn = document.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
        const response = await fetch("http://localhost:8080/customer/delivery", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                window.location.href = "/login.html";
                return;
            }

            let errorMsg = "Error saving address";
            try {
                const error = await response.json();
                errorMsg = error.message || error.error || errorMsg;
            } catch {
                const text = await response.text();
                if (text) errorMsg = text;
            }

            throw new Error(errorMsg);
        }

        alert("Address saved successfully!");
    localStorage.setItem("checkoutAddressUpdated", Date.now().toString());
        document.getElementById("form").reset();
        window.location.href = "/index.html";

    } catch (error) {
        console.error("Unexpected error:", error);
        alert(error.message || "Server connection failure.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save";
    }
});

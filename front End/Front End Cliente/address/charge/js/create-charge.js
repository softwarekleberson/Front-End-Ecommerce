document.getElementById("form").addEventListener("submit", async function (event) {
    event.preventDefault();

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
        main: document.getElementById("main").value === "true" // converte "true"/"false" em boolean
    };

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/login.html";
            return;
        }

        const response = await fetch("http://localhost:8080/customer/charge", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            let errorMsg = "Error saving address.";

            try {
                const error = await response.json();
                if (error.message) {
                    errorMsg = error.message;
                } else if (error.error) {
                    errorMsg = error.error;
                }
            } catch (e) {
                console.warn("Error reading error response:", e);
            }

            alert(errorMsg);
            return;
        }

        alert("Address saved successfully!");
        document.getElementById("form").reset();
        window.location.href = "index.html";

    } catch (error) {
        console.error("Unexpected error:", error);
        alert("Connection to the server failed.");
        window.location.href = "/login.html";
    }
});

document.getElementById("form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = {
        gender: document.getElementById("gender").value,
        name: document.getElementById("name").value,
        birth: document.getElementById("birth").value,
        cpf: document.getElementById("cpf").value,
        password: document.getElementById("password").value,
        confirmPassword: document.getElementById("confirmPassword").value,
        email: document.getElementById("email").value,
        ddd: document.getElementById("ddd").value,
        phone: document.getElementById("phone").value,
        typePhone: document.getElementById("typePhone").value,
    };

    try {
        const response = await fetch("http://localhost:8080/auth/customer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { message: "Unknown server error" };
            }

            alert("Error registering customer: " + (errorData.message || JSON.stringify(errorData)));

            throw errorData;
        }

        const result = await response.json();
        console.log("Form successfully submitted!", result);

        document.getElementById("form").reset();
        window.location.href = "/index.html";

    } catch (error) {
        console.error("Error captured:", error);
    }
});

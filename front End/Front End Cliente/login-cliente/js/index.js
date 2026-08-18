document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();

        try {
            const response = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: senha })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Invalid credentials");
            }

            const result = await response.json();

            // Salva o token JWT no localStorage
            localStorage.setItem("token", result.token);

            window.location.href = "/index.html"; // redireciona pro painel
        } catch (error) {
            alert(`Login failed: ${error.message}`);
            console.error("Error details:", error);
        }
    });
});

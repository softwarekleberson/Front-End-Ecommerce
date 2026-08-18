// 1. VERIFICAÇÃO IMEDIATA: Executa assim que o script é carregado
(function verificarAutenticacao() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login.html";
    }
})();

// 2. LOGICA DO FORMULÁRIO (Seu código original com pequenos ajustes)
document.getElementById("form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }

    // Como já verificamos no topo, aqui serve como uma garantia extra
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/customer/password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Usando Template Literals para ficar mais limpo
            },
            body: JSON.stringify({ password, confirmPassword }) // Enviando os dados
        });

        if (!response.ok) {
            // Se o token expirou ou é inválido no backend
            if (response.status === 403 || response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login.html";
                return;
            }

            let errorMsg = "Error updating password.";
            try {
                const data = await response.json();
                errorMsg = data.message || data.error || errorMsg;
            } catch {
                const text = await response.text();
                if (text) errorMsg = text;
            }

            alert(errorMsg);
            return;
        }

        alert("Password updated successfully!");
        document.getElementById("form").reset();
        window.location.href = "/index.html";

    } catch (error) {
        console.error("Unexpected error:", error);
        alert("Server error. Please try again later.");
    }
});
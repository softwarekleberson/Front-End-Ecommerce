document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        const admData = { email, password };

        try {
            const response = await fetch("http://localhost:8080/auth/adm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                    // Linha do Authorization removida aqui
                },
                body: JSON.stringify(admData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Error creating administrator.");
            }

            let result = null;
            const text = await response.text();
            if (text) {
                result = JSON.parse(text);
                console.log("Adm created:", result);
            }

            alert("Administrator created successfully!");
            form.reset();
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to create administrator. Please try again.");
        }
    });
});
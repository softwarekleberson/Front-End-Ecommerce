document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get("id");

    const cardData = {
      
      main: document.getElementById("main").checked,

      printedName: document.getElementById("printedName").value,
      numberCard: document.getElementById("numberCard").value,
      code: document.getElementById("code").value,
      expirationDate: document.getElementById("expirationDate").value,
      flag: document.getElementById("flag").value,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login.html";
        return;
      }

      const response = await fetch(`http://localhost:8080/customer/card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Envia o token no cabeçalho
        },
        body: JSON.stringify(cardData),
      });

      if (response.ok) {
        alert("Card successfully registered!");
        form.reset();
        window.location.href = "/index.html";
      } else {
        const errorResponse = await response.json().catch(() => ({}));
        if (errorResponse.message) {
          alert(`Error: ${errorResponse.message}`);
        } else {
          alert("Could not register the card. Please check your data.");
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Unexpected error occurred. Check console for details.");
    }
  });
});

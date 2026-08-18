document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        alert("Product ID not found in URL!");
        return;
    }

    try {
        // Faz a requisição GET ao backend
        const response = await fetch(`http://localhost:8080/public/product/${productId}`);

        if (!response.ok) {
            throw new Error(`Failed to load product. Status: ${response.status}`);
        }

        const product = await response.json();

        // Atualiza informações principais
        document.getElementById("name").textContent = product.name;
        document.querySelector(".description").textContent = product.description;
        document.querySelector(".price").textContent =
            `${product.typeCoin === 'REAL' ? 'R$' : '$'} ${product.price}`;

        // Atualiza imagens (todas as mídias)
        const imageContainer = document.querySelector(".product-image");
        imageContainer.innerHTML = ""; // limpa antes

        if (product.midias && product.midias.length > 0) {
            const mainImage = document.createElement("img");
            mainImage.id = "mainImage";
            mainImage.src = product.midias[0].url;
            mainImage.alt = product.name;
            imageContainer.appendChild(mainImage);

            if (product.midias.length > 1) {
                const thumbnailContainer = document.createElement("div");
                thumbnailContainer.classList.add("thumbnails");

                product.midias.forEach((midia, index) => {
                    const thumb = document.createElement("img");
                    thumb.src = midia.url;
                    thumb.alt = `Image ${index + 1}`;
                    thumb.addEventListener("click", () => {
                        mainImage.src = midia.url;
                    });
                    thumbnailContainer.appendChild(thumb);
                });

                imageContainer.appendChild(thumbnailContainer);
            }
        } else {
            const placeholder = document.createElement("img");
            placeholder.src = "https://via.placeholder.com/500x500?text=No+Image";
            placeholder.alt = "No Image Available";
            imageContainer.appendChild(placeholder);
        }

        // Atualiza as informações específicas da bag
        document.getElementById("color").innerHTML = `<strong>Color:</strong> ${product.color}`;
        document.getElementById("volume").innerHTML = `<strong>Volume:</strong> ${product.volume} L`;

    } catch (error) {
        console.error("Error loading product details:", error);
        alert("Error loading product details. Please try again later.");
    }
});

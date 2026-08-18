document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        alert("Product ID not found in URL!");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/public/product/${productId}`);

        if (!response.ok) {
            throw new Error(`Failed to load product. Status: ${response.status}`);
        }

        const product = await response.json();

        document.getElementById("name").textContent = product.name;
        document.querySelector(".price").textContent = `${product.typeCoin === 'REAL' ? 'R$' : '$'} ${product.price}`;
        document.querySelector(".synopsis").textContent = product.description;

        const imgElement = document.querySelector(".product-image img");
        if (product.midias && product.midias.length > 0) {
            imgElement.src = product.midias[0].url;
        } else {
            imgElement.src = "https://via.placeholder.com/500x500?text=No+Image";
        }

        // Informações técnicas específicas do livro
        document.getElementById("author").innerHTML = `<strong>Author:</strong> ${product.author}`;
        document.getElementById("edition").innerHTML = `<strong>Edition:</strong> ${product.edition}`;
        document.getElementById("page").innerHTML = `<strong>Pages:</strong> ${product.page}`;
        document.getElementById("isbn").innerHTML = `<strong>ISBN:</strong> ${product.isbn}`;
        document.getElementById("categoryBook").innerHTML = `<strong>Category:</strong> ${product.categoryBook}`;
        document.getElementById("height").innerHTML = `<strong>Dimensions:</strong> ${product.height}cm x ${product.width}cm x ${product.length}cm`;
        document.getElementById("publisherDate").innerHTML = `<strong>Published:</strong> ${product.publisherDate}`;
        document.getElementById("weight").innerHTML = `<strong>Weight:</strong> ${product.weight}kg`;

    } catch (error) {
        console.error("Error loading product details:", error);
    }
});

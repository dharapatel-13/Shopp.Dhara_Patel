
const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilters = document.getElementById("categoryFilters");
const sortSelect = document.getElementById("sortSelect");

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartItems = document.getElementById("cartItems");

const cartCount = document.getElementById("cartCount");
const drawerCount = document.getElementById("drawerCount");
const cartTotal = document.getElementById("cartTotal");

const toast = document.getElementById("toast");

let products = [];
let selectedCategory = "All";
let cart = JSON.parse(localStorage.getItem("shopzoneCart")) || [];

// Format price in Indian Rupees
function formatPrice(price) {
    return "₹" + price.toLocaleString("en-IN");
}

// Show notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Fetch products from JSON file
async function loadProducts() {
    try {
        productGrid.innerHTML = '<div class="loading">Loading your favorites...</div>';

        const response = await fetch("products.json");

        if (!response.ok) {
            throw new Error("Unable to load products");
        }

        products = await response.json();

        displayProducts();

        updateCart();

    } catch (error) {
        productGrid.innerHTML = `
            <div class="no-results">
                <h3>Oops! Something went wrong.</h3>
                <p>Please run this website using VS Code Live Server.</p>
            </div>
        `;

        console.error(error);
    }
}

// Display product cards
function displayProducts() {

    const searchValue = searchInput.value.toLowerCase().trim();

    let filteredProducts = products.filter(product => {

        const matchesCategory =
            selectedCategory === "All" ||
            product.category === selectedCategory;

        const matchesSearch =
            product.name.toLowerCase().includes(searchValue) ||
            product.category.toLowerCase().includes(searchValue);

        return matchesCategory && matchesSearch;
    });

    // Sorting
    const sortValue = sortSelect.value;

    if (sortValue === "low") {
        filteredProducts.sort((a, b) => a.price - b.price);
    }

    if (sortValue === "high") {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    if (sortValue === "rating") {
        filteredProducts.sort((a, b) => b.rating - a.rating);
    }

    document.getElementById("resultCount").textContent =
        `${filteredProducts.length} PRODUCTS FOUND`;

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="no-results">
                <h3>No products found ✦</h3>
                <p>Try another search or category.</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card">

            <div class="product-image">
                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                >
                <span class="product-tag">${product.tag}</span>
            </div>

            <div class="product-info">

                <span class="product-category">
                    ${product.category}
                </span>

                <h3>${product.name}</h3>

                <div class="product-rating">
                    ★★★★★
                    <span>${product.rating} / 5</span>
                </div>

                <div class="product-bottom">

                    <span class="product-price">
                        ${formatPrice(product.price)}
                    </span>

                    <button
                        class="add-cart"
                        data-id="${product.id}"
                    >
                        + Add
                    </button>

                </div>
            </div>
        </article>
    `).join("");
}

// Search products
searchInput.addEventListener("input", displayProducts);

// Category filtering
categoryFilters.addEventListener("click", function(event) {

    const button = event.target.closest(".category-btn");

    if (!button) return;

    document.querySelectorAll(".category-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    button.classList.add("active");

    selectedCategory = button.dataset.category;

    displayProducts();
});

// Sorting
sortSelect.addEventListener("change", displayProducts);

// Add products to cart
productGrid.addEventListener("click", function(event) {

    const button = event.target.closest(".add-cart");

    if (!button) return;

    const productId = Number(button.dataset.id);

    addToCart(productId);
});

function addToCart(productId) {

    const product = products.find(item => item.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();

    showToast(`${product.name} added to your cart!`);
}

// Save cart
function saveCart() {
    localStorage.setItem("shopzoneCart", JSON.stringify(cart));
    updateCart();
}

// Update cart display
function updateCart() {

    const totalItems = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    cartCount.textContent = totalItems;
    drawerCount.textContent = `(${totalItems})`;
    cartTotal.textContent = formatPrice(totalPrice);

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">
                <span>♡</span>
                <h3>Your cart is empty.</h3>
                <p>Let's find something you love.</p>
            </div>
        `;

        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">

            <img src="${item.image}" alt="${item.name}">

            <div class="cart-item-details">

                <h4>${item.name}</h4>

                <strong>${formatPrice(item.price)}</strong>

                <div class="quantity-controls">

                    <button
                        data-action="decrease"
                        data-id="${item.id}"
                    >−</button>

                    <span>${item.quantity}</span>

                    <button
                        data-action="increase"
                        data-id="${item.id}"
                    >+</button>

                </div>

                <button
                    class="remove-item"
                    data-action="remove"
                    data-id="${item.id}"
                >
                    Remove item
                </button>

            </div>

        </div>
    `).join("");
}

// Cart quantity and remove actions
cartItems.addEventListener("click", function(event) {

    const button = event.target.closest("[data-action]");

    if (!button) return;

    const productId = Number(button.dataset.id);
    const action = button.dataset.action;

    const item = cart.find(product => product.id === productId);

    if (!item) return;

    if (action === "increase") {
        item.quantity++;
    }

    if (action === "decrease") {
        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(product => product.id !== productId);
        }
    }

    if (action === "remove") {
        cart = cart.filter(product => product.id !== productId);
        showToast("Product removed from cart.");
    }

    saveCart();
});

// Open cart
function openCart() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
}

// Close cart
function closeCart() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("show");
    document.body.style.overflow = "";
}

document.getElementById("openCart").addEventListener("click", openCart);

document.getElementById("closeCart").addEventListener("click", closeCart);

cartOverlay.addEventListener("click", closeCart);

// Continue shopping
document.getElementById("checkoutBtn").addEventListener("click", function() {
    closeCart();

    document.getElementById("products").scrollIntoView({
        behavior: "smooth"
    });

    showToast("Keep discovering your favorites!");
});

// Mobile navigation
document.getElementById("menuToggle").addEventListener("click", function() {
    document.querySelector(".nav-links").classList.toggle("show");
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", function() {
        document.querySelector(".nav-links").classList.remove("show");
    });
});

// Newsletter form
document.getElementById("newsletterForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const emailInput = this.querySelector("input");

    document.getElementById("newsletterMessage").textContent =
        "Thank you for joining the ShopZone community! ✦";

    emailInput.value = "";

    showToast("Welcome to ShopZone!");
});

// Initial setup
loadProducts();

/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - EXPANDED MENU JS (menu.js)
   --------------------------------------------------------------------------
   PART 2 INTEGRATION: Connects Live Menu to DishServlet API (/canteen/dish)
   Supports Search, Sort, Ingredients, Allergens, Nutrition & Out of Stock Alerts
   ========================================================================== */

let liveDishes = [];
let currentCategory = "All";

function getDishApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/dish${queryString}`;
  }
  return `${window.location.origin}${contextPath}/dish${queryString}`;
}

function getMenuContainer() {
  return document.getElementById("menuGridContainer") || document.getElementById("menuContainer");
}

async function fetchDishesFromBackend(category = "All", sortBy = "") {
  currentCategory = category;
  const container = getMenuContainer();
  if (!container) return;

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-warning" role="status"><span class="visually-hidden">Loading...</span></div>
      <p class="mt-3 mb-0 text-secondary">Loading menu items from the canteen kitchen...</p>
    </div>
  `;

  try {
    const apiUrl = getDishApiUrl(`?category=${encodeURIComponent(category)}&sortBy=${sortBy}`);
    const response = await fetch(apiUrl);
    if (response.ok) {
      liveDishes = await response.json();
      renderMenuCards(liveDishes);
      return;
    }
    renderMenuError("Unable to load menu items. Please refresh the page.");
  } catch (err) {
    console.warn("Backend unavailable for dish fetch:", err);
    renderMenuError("Unable to connect to the menu service. Please try again later.");
  }
}

function renderMenuError(message) {
  const container = getMenuContainer();
  if (!container) return;
  container.innerHTML = `
    <div class="col-12 text-center py-5 text-danger">
      <i class="bi bi-exclamation-triangle-fill fs-1"></i>
      <p class="mt-3 mb-0">${message}</p>
    </div>
  `;
}

function renderMenuCards(items) {
  const container = getMenuContainer();
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = "<div class='col-12 text-center text-muted py-4'>No dishes found matching your selection.</div>";
    return;
  }

  items.forEach(dish => {
    const isOut = !dish.isAvailable || (dish.stockQuantity !== undefined && dish.stockQuantity <= 0);
    const stockBadge = isOut ? '<span class="badge bg-danger ms-1">Out of Stock</span>' : '';
    const offerBadge = dish.isOffer ? '<span class="badge bg-warning text-dark me-1">Special Offer</span>' : '';

    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4 mb-4";
    card.innerHTML = `
      <div class="card custom-card h-100 shadow-sm ${isOut ? 'opacity-75' : ''}">
        <img src="${dish.image || 'assets/images/burger.jpg'}" class="card-img-top" style="height: 180px; object-fit: cover;" alt="${dish.name}">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title fw-bold mb-0">${dish.name}</h5>
            <span class="badge bg-canteen-accent">₹${dish.price}</span>
          </div>
          <div class="mb-2">
            <span class="badge bg-secondary me-1">${dish.category}</span>
            ${offerBadge}
            ${stockBadge}
          </div>
          <p class="card-text text-secondary small flex-grow-1">${dish.description || 'Delicious canteen dish.'}</p>
          
          <div class="bg-light p-2 rounded mb-3 small">
            <div><strong>Ingredients:</strong> ${dish.ingredients || 'Standard'}</div>
            <div><strong>Allergens:</strong> ${dish.allergens || 'None'}</div>
            <div><strong>Nutrition:</strong> ${dish.nutrition || 'N/A'}</div>
          </div>

          <div class="d-flex justify-content-between align-items-center">
            <span class="text-muted small"><i class="bi bi-clock"></i> ${dish.prepTime || '10 mins'}</span>
            ${isOut ? 
              '<button class="btn btn-sm btn-secondary" disabled>Unavailable</button>' : 
              `<button class="btn btn-sm btn-canteen-primary" onclick="addCartItem('${dish.name.replace(/'/g, "\\'")}', ${dish.price}, ${dish.id}, '${(dish.category || 'Canteen Special').replace(/'/g, "\\'")}', '${(dish.description || '').replace(/'/g, "\\'")}')"><i class="bi bi-cart-plus"></i> Add ₹${dish.price}</button>`
            }
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterMenuCategory(category, event) {
  document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");
  fetchDishesFromBackend(category);
}

function searchMenuDishes() {
  const query = document.getElementById("menuSearchInput")?.value.toLowerCase().trim() || "";
  const filtered = liveDishes.filter(d => 
    d.name.toLowerCase().includes(query) || 
    (d.description && d.description.toLowerCase().includes(query)) ||
    (d.ingredients && d.ingredients.toLowerCase().includes(query))
  );
  renderMenuCards(filtered);
}

function sortMenuDishes(sortBy) {
  fetchDishesFromBackend(currentCategory, sortBy);
}

document.addEventListener("DOMContentLoaded", function () {
    fetchDishesFromBackend("All");

    const searchInput = document.getElementById("menuSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", searchMenuDishes);
    }

    const sortSelect = document.getElementById("menuSortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", function () {
            sortMenuDishes(this.value);
        });
    }
});

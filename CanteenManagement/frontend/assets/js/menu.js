/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - MENU JAVASCRIPT (menu.js)
   --------------------------------------------------------------------------
   Educational Project - Handles Menu Page filtering, search, and dish modal:
   - Category filtering (Breakfast, Meals, Snacks, Beverages)
   - Real-time search filter by dish name
   - Detailed Dish Modal display with badges & nutritional details
   ========================================================================== */

let activeCategoryFilter = "All";

/**
 * Render dish cards grid dynamically on menu page
 * @param {Array} dishList - Filtered array of dish objects
 */
function renderMenuGrid(dishList = dishes) {
  const menuContainer = document.getElementById("menuGridContainer");
  if (!menuContainer) return;

  menuContainer.innerHTML = "";

  if (dishList.length === 0) {
    menuContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-search display-4 text-muted"></i>
        <h5 class="mt-3 text-secondary">No food items match your criteria.</h5>
      </div>
    `;
    return;
  }

  dishList.forEach(dish => {
    // Generate badges HTML
    let badgesHtml = "";
    if (dish.isOffer) badgesHtml += `<span class="badge badge-offer me-1">Special Offer</span>`;
    if (dish.isCombo) badgesHtml += `<span class="badge badge-combo me-1">Combo Pack</span>`;
    if (dish.isRecommended) badgesHtml += `<span class="badge badge-recommended me-1">Chef Recommended</span>`;

    const col = document.createElement("div");
    col.className = "col-md-4 col-sm-6 mb-4";
    col.innerHTML = `
      <div class="card custom-card h-100">
        <img src="${dish.image}" class="card-img-top dish-img" alt="${dish.name}">
        <div class="card-body d-flex flex-column">
          <div class="mb-2">${badgesHtml}</div>
          <h5 class="card-title fw-bold text-dark mb-1">${dish.name}</h5>
          <p class="text-muted small mb-2"><i class="bi bi-tag-fill me-1"></i>${dish.category} | <i class="bi bi-clock me-1"></i>${dish.prepTime}</p>
          <p class="card-text text-secondary small flex-grow-1">${dish.description}</p>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="fs-5 fw-bold text-dark">₹${dish.price}</span>
            <div>
              <button class="btn btn-sm btn-outline-dark me-1" onclick="openDishDetailModal(${dish.id})">Details</button>
              <button class="btn btn-sm btn-canteen-primary" onclick="addToCartMock('${dish.name}', ${dish.price})">Add to Order</button>
            </div>
          </div>
        </div>
      </div>
    `;
    menuContainer.appendChild(col);
  });
}

/**
 * Filter menu grid by category name
 * @param {string} categoryName - Category name or "All"
 */
function filterCategory(categoryName) {
  activeCategoryFilter = categoryName;

  // Update active button state
  const categoryButtons = document.querySelectorAll(".category-filter-btn");
  categoryButtons.forEach(btn => {
    if (btn.getAttribute("data-category") === categoryName) {
      btn.classList.remove("btn-outline-dark");
      btn.classList.add("btn-canteen-primary");
    } else {
      btn.classList.remove("btn-canteen-primary");
      btn.classList.add("btn-outline-dark");
    }
  });

  applyFilters();
}

/**
 * Apply combined category filter and live search query
 */
function applyFilters() {
  const searchQuery = document.getElementById("menuSearchInput")?.value.toLowerCase().trim() || "";

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = (activeCategoryFilter === "All") || (dish.category === activeCategoryFilter);
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery) || dish.description.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  renderMenuGrid(filteredDishes);
}

/**
 * Populate and display Modal details for a specific dish
 * @param {number} dishId - Target dish ID
 */
function openDishDetailModal(dishId) {
  const dish = dishes.find(d => d.id === dishId);
  if (!dish) return;

  const modalBody = document.getElementById("dishModalBody");
  const modalTitle = document.getElementById("dishModalTitle");

  if (modalTitle) modalTitle.textContent = dish.name;
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <img src="${dish.image}" class="img-fluid rounded mb-3" alt="${dish.name}">
        </div>
        <div class="col-md-6">
          <h4 class="fw-bold">₹${dish.price}</h4>
          <p class="text-secondary">${dish.description}</p>
          <hr>
          <p><strong>Category:</strong> ${dish.category}</p>
          <p><strong>Ingredients:</strong> ${dish.ingredients}</p>
          <p><strong>Allergens:</strong> ${dish.allergens}</p>
          <p><strong>Nutrition:</strong> ${dish.nutrition}</p>
          <p><strong>Preparation Time:</strong> ${dish.prepTime}</p>
        </div>
      </div>
    `;
  }

  const modalElem = new bootstrap.Modal(document.getElementById("dishDetailModal"));
  modalElem.show();
}

/**
 * Add dish to cart mock notification
 * @param {string} dishName - Dish title
 * @param {number} price - Dish price
 */
function addToCartMock(dishName, price) {
  const cartBadge = document.getElementById("cart-count");
  if (cartBadge) {
    let currentCount = parseInt(cartBadge.textContent) || 0;
    cartBadge.textContent = currentCount + 1;
  }
  showNotification(`Added ${dishName} (₹${price}) to your cart!`, "success");
}

/**
 * Initialize Menu page interactions on DOM Load
 */
document.addEventListener("DOMContentLoaded", function () {
  renderMenuGrid();

  const searchInput = document.getElementById("menuSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
});

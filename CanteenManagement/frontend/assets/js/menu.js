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

function getFeedbackApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/feedback${queryString}`;
  }
  return `${window.location.origin}${contextPath}/feedback${queryString}`;
}

async function fetchDishFeedback(dishId) {
  try {
    const response = await fetch(getFeedbackApiUrl(`?dishId=${encodeURIComponent(dishId)}`));
    if (!response.ok) throw new Error("Failed to fetch item feedback");
    return await response.json();
  } catch (err) {
    console.warn("Unable to load feedback for dish:", err);
    return [];
  }
}

function renderFeedbackList(feedbackList) {
  const listContainer = document.getElementById("feedbackListContainer");
  if (!listContainer) return;

  if (!feedbackList || feedbackList.length === 0) {
    listContainer.innerHTML = '<div class="feedback-empty">No feedback shared yet. Be the first to review this item.</div>';
    return;
  }

  listContainer.innerHTML = feedbackList.map(item => {
    const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
    const safeComment = (item.comments || 'No additional comments.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <div class="feedback-item">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong>${(item.userName || 'Customer').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>
          <span class="stars">${stars}</span>
        </div>
        <small>${new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
        <p class="mb-0 mt-2 text-secondary">${safeComment}</p>
      </div>
    `;
  }).join('');
}

function setFeedbackStars(selectedRating) {
  const stars = document.querySelectorAll('.feedback-star');
  stars.forEach(star => {
    star.classList.toggle('active', Number(star.dataset.rating) <= Number(selectedRating));
  });
  const selectedText = document.getElementById('selectedRatingValue');
  if (selectedText) selectedText.textContent = selectedRating;
}

async function openFeedbackModal(dish, mode = 'write') {
  const modal = document.getElementById('dishFeedbackModal');
  if (!modal) return;

  const title = document.getElementById('feedbackDishTitle');
  const averageBadge = document.getElementById('feedbackAverageBadge');
  const countBadge = document.getElementById('feedbackCountBadge');
  const formSection = document.getElementById('feedbackFormSection');
  const submitBtn = document.getElementById('submitFeedbackBtn');
  const commentInput = document.getElementById('feedbackComment');
  const starButtons = document.querySelectorAll('.feedback-star');

  if (title) title.textContent = `${dish.name} Feedback`;

  const feedbackList = await fetchDishFeedback(dish.id);
  const average = feedbackList.length ? (feedbackList.reduce((sum, item) => sum + Number(item.rating), 0) / feedbackList.length).toFixed(1) : '0.0';
  const count = feedbackList.length || 0;

  if (averageBadge) averageBadge.textContent = `${average} ★`;
  if (countBadge) countBadge.textContent = `${count} review${count === 1 ? '' : 's'}`;
  renderFeedbackList(feedbackList);

  if (formSection) {
    formSection.style.display = mode === 'write' ? 'block' : 'none';
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      const user = getActiveUserSession();
      if (!user) {
        showNotification('Please log in before submitting feedback.', 'warning');
        return;
      }

      const rating = Number(document.getElementById('selectedRatingValue')?.textContent || 5);
      const comments = (commentInput?.value || '').trim();

      try {
        const form = new URLSearchParams();
        form.append('action', 'addFeedback');
        form.append('userId', user.userId || user.id);
        form.append('dishId', dish.id);
        form.append('rating', rating);
        form.append('comments', comments);

        const response = await fetch(getFeedbackApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString()
        });

        const data = await response.json();
        if (!response.ok || data.status !== 'success') {
          throw new Error(data.message || 'Unable to add feedback');
        }

        if (commentInput) commentInput.value = '';
        setFeedbackStars(5);
        const refreshed = await fetchDishFeedback(dish.id);
        renderFeedbackList(refreshed);
        const avg = refreshed.length ? (refreshed.reduce((sum, item) => sum + Number(item.rating), 0) / refreshed.length).toFixed(1) : '0.0';
        if (averageBadge) averageBadge.textContent = `${avg} ★`;
        if (countBadge) countBadge.textContent = `${refreshed.length} review${refreshed.length === 1 ? '' : 's'}`;
        showNotification('✅ Thank you for sharing your feedback.', 'success');
      } catch (err) {
        console.error('Feedback submission failed:', err);
        showNotification(err.message || 'Unable to save your feedback right now.', 'error');
      }
    };
  }

  starButtons.forEach(button => {
    button.addEventListener('click', () => setFeedbackStars(button.dataset.rating));
  });

  setFeedbackStars(5);

  const modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
  modalInstance.show();
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
    const dishNameSafe = (dish.name || 'Dish').replace(/"/g, '&quot;');

    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4 mb-4";
    card.innerHTML = `
      <div class="card custom-card h-100 shadow-sm ${isOut ? 'opacity-75' : ''}">
        <img src="${dish.image || 'assets/images/burger.jpg'}" class="card-img-top" style="height: 180px; object-fit: cover;" alt="${dishNameSafe}">
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

          <div class="feedback-action-row">
            <button type="button" class="btn btn-sm btn-outline-warning" data-feedback-mode="write" data-dish-id="${dish.id}" data-dish-name="${dishNameSafe}"><i class="bi bi-chat-dots"></i> Feedback</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-feedback-mode="view" data-dish-id="${dish.id}" data-dish-name="${dishNameSafe}"><i class="bi bi-eye"></i> See Feedback</button>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="text-muted small"><i class="bi bi-clock"></i> ${dish.prepTime || '10 mins'}</span>
            ${isOut ? 
              '<button class="btn btn-sm btn-secondary" disabled>Unavailable</button>' : 
              `<button class="btn btn-sm btn-canteen-primary" onclick="addCartItem('${dish.name.replace(/'/g, "\\'")}', ${dish.price}, ${dish.id}, '${(dish.category || 'Canteen Special').replace(/'/g, "\\'")}', '${(dish.description || '').replace(/'/g, "\\'")}')"><i class="bi bi-cart-plus"></i> Add ₹${dish.price}</button>`
            }
          </div>
        </div>
      </div>
    `;

    const feedbackButtons = card.querySelectorAll('[data-dish-id]');
    feedbackButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const selectedDish = {
          id: Number(button.dataset.dishId),
          name: button.dataset.dishName || 'Dish'
        };
        await openFeedbackModal(selectedDish, button.dataset.feedbackMode || 'write');
      });
    });

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

/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - MAIN JAVASCRIPT (main.js)
   --------------------------------------------------------------------------
   Educational Project - Global Datasets & Helper Functions
   Automated Role-Specific Navbar Session Rendering & Dynamic Dashboard Routing
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. MOCK DATASETS (Fallback State)
// --------------------------------------------------------------------------

const users = [
  { id: 1, name: "Rahul Sharma", email: "rahul@college.edu", role: "Student", department: "Computer Engg", status: "Active" },
  { id: 2, name: "Priya Patel", email: "priya@college.edu", role: "Student", department: "IT Engg", status: "Active" },
  { id: 3, name: "Sanjay Kumar", email: "sanjay@college.edu", role: "Manager", department: "Canteen Mgmt", status: "Active" },
  { id: 4, name: "Amit Verma", email: "amit@college.edu", role: "Staff", department: "Kitchen Staff", status: "Active" },
  { id: 5, name: "Ramesh Singh", email: "ramesh@college.edu", role: "Staff", department: "Delivery Staff", status: "Active" }
];

const dishes = [
  {
    id: 1,
    name: "Veg Cheese Burger",
    category: "Snacks",
    price: 80,
    description: "Crispy vegetable patty with cheese, fresh lettuce, and special sauce.",
    ingredients: "Potato, Cheese, Lettuce, Bun, Spices",
    allergens: "Gluten, Dairy",
    nutrition: "350 kcal",
    prepTime: "10 mins",
    isAvailable: true,
    isOffer: true,
    isCombo: false,
    isRecommended: true,
    image: "assets/images/burger.jpg"
  },
  {
    id: 2,
    name: "Paneer Pizza",
    category: "Main Course",
    price: 150,
    description: "Freshly baked pizza topped with spiced paneer cubes and mozzarella.",
    ingredients: "Flour, Paneer, Tomato Sauce, Cheese",
    allergens: "Gluten, Milk",
    nutrition: "520 kcal",
    prepTime: "15 mins",
    isAvailable: true,
    isOffer: false,
    isCombo: true,
    isRecommended: true,
    image: "assets/images/pizza.jpg"
  },
  {
    id: 3,
    name: "Special Veg Thali",
    category: "Meals",
    price: 120,
    description: "Complete meal with 2 Curries, Dal, Rice, 3 Roti, Salad & Sweet.",
    ingredients: "Wheat, Rice, Pulses, Paneer, Vegetables",
    allergens: "Gluten, Dairy",
    nutrition: "650 kcal",
    prepTime: "12 mins",
    isAvailable: true,
    isOffer: true,
    isCombo: true,
    isRecommended: true,
    image: "assets/images/thali.jpg"
  },
  {
    id: 4,
    name: "Masala Dosa",
    category: "Breakfast",
    price: 60,
    description: "Crispy rice crepe filled with spiced potato masala served with chutney & sambar.",
    ingredients: "Rice, Potato, Lentils, Spices",
    allergens: "Mustard",
    nutrition: "280 kcal",
    prepTime: "8 mins",
    isAvailable: true,
    isOffer: false,
    isCombo: false,
    isRecommended: false,
    image: "assets/images/thali.jpg"
  },
  {
    id: 5,
    name: "Cold Coffee with Ice Cream",
    category: "Beverages",
    price: 50,
    description: "Rich blended coffee topped with chocolate syrup and vanilla ice cream.",
    ingredients: "Milk, Coffee, Sugar, Ice Cream",
    allergens: "Dairy",
    nutrition: "210 kcal",
    prepTime: "5 mins",
    isAvailable: true,
    isOffer: false,
    isCombo: false,
    isRecommended: true,
    image: "assets/images/burger.jpg"
  }
];

const orders = [
  { id: 101, studentName: "Rahul Sharma", items: "Veg Cheese Burger x 2", total: 160, status: "New", date: "2026-08-06 12:30 PM" },
  { id: 102, studentName: "Priya Patel", items: "Paneer Pizza x 1", total: 150, status: "Preparing", date: "2026-08-06 12:35 PM" },
  { id: 103, studentName: "Rahul Sharma", items: "Special Veg Thali x 1", total: 120, status: "Prepared", date: "2026-08-06 12:40 PM" },
  { id: 104, studentName: "Priya Patel", items: "Masala Dosa x 2", total: 120, status: "Ready For Delivery", date: "2026-08-06 12:45 PM" },
  { id: 105, studentName: "Rahul Sharma", items: "Cold Coffee x 2", total: 100, status: "Delivered", date: "2026-08-06 12:15 PM" }
];

let cartItems = JSON.parse(localStorage.getItem("canteen_cart") || "[]");

function saveCartItems() {
  localStorage.setItem("canteen_cart", JSON.stringify(cartItems));
  updateCartCount();
}

function updateCartBadge() {
  const cartBadge = document.getElementById("cart-count");
  if (!cartBadge) return;
  const totalQty = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  cartBadge.textContent = totalQty.toString();
}

function addCartItem(name, price, dishId = 0, category = "Snacks", description = "") {
  const unitPrice = Number(price) || 0;
  const existing = cartItems.find(item => item.dishId === dishId && item.name === name);
  if (existing) {
    existing.quantity = (existing.quantity || 0) + 1;
  } else {
    cartItems.push({ dishId, name, price: unitPrice, quantity: 1, category, description });
  }
  saveCartItems();
  showNotification(`Added ${name} to cart`, "success");
}

function removeCartItem(index) {
  if (index < 0 || index >= cartItems.length) return;
  cartItems.splice(index, 1);
  saveCartItems();
  renderCartModal();
}

function changeCartItemQuantity(index, delta) {
  const item = cartItems[index];
  if (!item) return;
  item.quantity = Math.max(1, (item.quantity || 1) + delta);
  if (item.quantity <= 0) {
    cartItems.splice(index, 1);
  }
  saveCartItems();
  renderCartModal();
}

function clearCartItems() {
  cartItems = [];
  saveCartItems();
  renderCartModal();
}

async function checkoutCart() {
  const user = getActiveUserSession();
  if (!user) {
    showNotification("Login first to place orders from cart.", "error");
    window.location.href = "login.html";
    return;
  }

  if (!cartItems.length) {
    showNotification("Your cart is empty.", "error");
    return;
  }

  const checkoutButton = document.getElementById("checkoutCartBtn");
  if (checkoutButton) checkoutButton.disabled = true;

  try {
    // Create a single aggregate order for the cart, then redirect to payment
    const totalAmount = cartItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0);
    const totalQty = cartItems.reduce((s, it) => s + (it.quantity || 0), 0) || 1;
    const firstDishId = cartItems[0]?.dishId || 0;

    // Save cart snapshot for later reference (receipt)
    localStorage.setItem('pending_cart', JSON.stringify(cartItems));

    const formData = new URLSearchParams();
    formData.append("userId", user.userId || user.id || 1);
    formData.append("dishId", firstDishId);
    formData.append("quantity", totalQty);
    formData.append("total", totalAmount);

    try {
      const response = await fetch(getOrderApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        // redirect to payment to complete payment before confirming
        clearCartItems();
        const orderId = data.orderId;
        window.location.href = `payment.html?orderId=${orderId}`;
        return;
      } else {
        showNotification('Failed to create order for payment. Try again.', 'error');
      }
    } catch (err) {
      console.error('Failed to create order for payment:', err);
      showNotification('Unable to reach order API. Try again later.', 'error');
    }
  } catch (e) {
    console.error("Cart checkout error:", e);
    showNotification("Checkout failed. Please try again later.", "error");
  } finally {
    if (checkoutButton) checkoutButton.disabled = false;
  }
}

function ensureCartModalExists() {
  if (document.getElementById("cartModal")) return;

  const modalHtml = `
    <div class="modal fade" id="cartModal" tabindex="-1" aria-labelledby="cartModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="cartModalLabel"><i class="bi bi-cart3 me-2"></i>My Cart</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="cartModalBody"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Continue Shopping</button>
            <button type="button" id="goToPaymentBtn" class="btn btn-outline-warning">Proceed to Pay</button>
            <button type="button" id="checkoutCartBtn" class="btn btn-canteen-primary">Place Order</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  document.getElementById("checkoutCartBtn")?.addEventListener("click", checkoutCart);
  document.getElementById("goToPaymentBtn")?.addEventListener("click", function () {
    // Shortcut to create order + go to payment (reuse checkout flow)
    const currentCart = JSON.parse(localStorage.getItem("canteen_cart") || "[]");
    if (!currentCart || currentCart.length === 0) {
      showNotification("Your cart is empty. Add items before proceeding to payment.", "error");
      return;
    }
    // Close modal then trigger checkout which will redirect to payment
    const cartModalElem = document.getElementById('cartModal');
    const bs = bootstrap.Modal.getInstance(cartModalElem);
    if (bs) bs.hide();
    // call checkoutCart which will create order and redirect to payment
    checkoutCart();
  });
}

function renderCartModal() {
  ensureCartModalExists();
  const body = document.getElementById("cartModalBody");
  if (!body) return;

  if (!cartItems.length) {
    body.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x fs-1 text-secondary"></i>
        <p class="text-secondary mt-3 mb-0">Your cart is empty. Add items from the menu first.</p>
      </div>
    `;
    return;
  }

  let totalAmount = 0;
  const rows = cartItems.map((item, index) => {
    const unitPrice = Number(item.price) || 0;
    const itemTotal = unitPrice * (item.quantity || 1);
    totalAmount += itemTotal;
    return `
      <tr>
        <td>${item.name}</td>
        <td>₹${unitPrice.toFixed(2)}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-secondary" onclick="changeCartItemQuantity(${index}, -1)">-</button>
            <span>${item.quantity}</span>
            <button class="btn btn-sm btn-outline-secondary" onclick="changeCartItemQuantity(${index}, 1)">+</button>
          </div>
        </td>
        <td>₹${itemTotal.toFixed(2)}</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="removeCartItem(${index})"><i class="bi bi-trash"></i></button></td>
      </tr>
    `;
  }).join("");

  body.innerHTML = `
    <div class="table-responsive">
      <table class="table align-middle mb-3">
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit Price</th>
            <th>Qty</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="d-flex justify-content-between align-items-center mt-3">
      <button class="btn btn-outline-danger" onclick="clearCartItems()">Clear Cart</button>
      <div class="text-end">
        <p class="mb-1 text-secondary">Items: ${cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</p>
        <h5 class="mb-0">Total: ₹${totalAmount.toFixed(2)}</h5>
      </div>
    </div>
  `;
}

function openCartModal() {
  ensureCartModalExists();
  renderCartModal();
  const modalElem = document.getElementById("cartModal");
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalElem);
  bsModal.show();
}

function ensureToastContainer() {
  if (document.getElementById('cpToastContainer')) return;
  const container = document.createElement('div');
  container.id = 'cpToastContainer';
  container.className = 'cp-toast-container';
  document.body.appendChild(container);
}

function showNotification(message, type = 'info', opts = {}) {
  ensureToastContainer();
  const container = document.getElementById('cpToastContainer');
  const toast = document.createElement('div');
  toast.className = `cp-toast cp-toast-${type}`;

  const icons = {
    success: '✔',
    error: '✖',
    warning: '⚠',
    info: 'ℹ'
  };

  const title = opts.title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info');

  toast.innerHTML = `
    <div class="cp-toast-left">${icons[type] || icons.info}</div>
    <div class="cp-toast-body">
      <div class="cp-toast-title">${title}</div>
      <div class="cp-toast-message">${message}</div>
    </div>
    <button class="cp-toast-close" aria-label="Close">&times;</button>
  `;

  container.prepend(toast);

  // close button
  toast.querySelector('.cp-toast-close').addEventListener('click', () => {
    toast.classList.add('cp-toast-hide');
    setTimeout(() => toast.remove(), 350);
  });

  // auto dismiss
  const delay = opts.duration || (type === 'error' ? 5000 : 3000);
  setTimeout(() => {
    toast.classList.add('cp-toast-hide');
    setTimeout(() => toast.remove(), 350);
  }, delay);
}

function getActiveUserSession() {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function getOrderApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/order${queryString}`;
  }
  return `${window.location.origin}${contextPath}/order${queryString}`;
}

function getUserApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/user${queryString}`;
  }
  return `${window.location.origin}${contextPath}/user${queryString}`;
}

function updateCartCount() {
  updateCartBadge();
}

function getActiveUserId() {
  const user = getActiveUserSession();
  if (!user) return null;
  return user.userId || user.id || null;
}

async function fetchUserProfileData(userId) {
  try {
    const response = await fetch(getUserApiUrl(`?id=${encodeURIComponent(userId)}`));
    if (!response.ok) throw new Error("Failed to fetch user profile");
    return await response.json();
  } catch (e) {
    console.warn("Could not fetch user profile:", e);
    return null;
  }
}

function setProfileFieldsEditable(editable) {
  const editableSelectors = [
    "#profileName",
    "#profilePhone",
    "#profileDepartment",
    "#profileLocation"
  ];
  editableSelectors.forEach(selector => {
    const field = document.querySelector(selector);
    if (field) field.readOnly = !editable;
  });

  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");
  if (editBtn) editBtn.classList.toggle("d-none", editable);
  if (saveBtn) saveBtn.classList.toggle("d-none", !editable);
  if (cancelBtn) cancelBtn.classList.toggle("d-none", !editable);
}

function populateProfileForm(userData) {
  if (!userData) return;
  const fields = {
    profileName: userData.name || "",
    profileEmail: userData.email || "",
    profilePhone: userData.phone || "",
    profileCollegeId: userData.college_id || userData.collegeId || "",
    profileDepartment: userData.department || "",
    profileLocation: userData.defaultLocation || userData.default_location || ""
  };

  Object.keys(fields).forEach(id => {
    const element = document.getElementById(id);
    if (element) element.value = fields[id];
  });

  const nameHeading = document.getElementById("profileUserName");
  const roleBadge = document.getElementById("profileUserRole");
  const departmentText = document.getElementById("profileUserDepartment");
  if (nameHeading) nameHeading.textContent = userData.name || "User Profile";
  if (roleBadge) roleBadge.textContent = userData.role || "Student Account";
  if (departmentText) departmentText.textContent = userData.department || "Department of Computer Engineering";
}

async function saveProfileChanges() {
  const userId = getActiveUserId();
  if (!userId) {
    showNotification("Please login again before saving.", "error");
    window.location.href = "login.html";
    return;
  }

  const name = document.getElementById("profileName")?.value.trim();
  const phone = document.getElementById("profilePhone")?.value.trim();
  const department = document.getElementById("profileDepartment")?.value.trim();
  const location = document.getElementById("profileLocation")?.value.trim();

  if (!name || !phone || !department) {
    showNotification("Please fill in all required fields.", "error");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateProfile");
    formData.append("userId", userId);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("department", department);
    formData.append("dietaryPreferences", "None");
    formData.append("defaultLocation", location || "Main Canteen Counter");

    const response = await fetch(getUserApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const result = await response.json();
    if (response.ok && result.status === "success") {
      showNotification(result.message, "success");
      setProfileFieldsEditable(false);
      const user = getActiveUserSession();
      if (user) {
        user.name = name;
        localStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("user", JSON.stringify(user));
      }
      renderGlobalNavbarSession();
    } else {
      showNotification(result.message || "Failed to save profile.", "error");
    }
  } catch (e) {
    console.error(e);
    showNotification("Unable to save profile. Try again later.", "error");
  }
}

function cancelProfileEdit() {
  setProfileFieldsEditable(false);
  const userId = getActiveUserId();
  if (userId) {
    fetchUserProfileData(userId).then(populateProfileForm);
  }
}

function logoutUser() {
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  window.location.href = "login.html";
}

async function renderProfilePage() {
  const user = getActiveUserSession();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userId = getActiveUserId();
  if (userId) {
    const profileData = await fetchUserProfileData(userId);
    if (profileData) {
      populateProfileForm(profileData);
    } else {
      populateProfileForm(user);
    }
  }

  setProfileFieldsEditable(false);

  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (editBtn) editBtn.addEventListener("click", () => setProfileFieldsEditable(true));
  if (saveBtn) saveBtn.addEventListener("click", saveProfileChanges);
  if (cancelBtn) cancelBtn.addEventListener("click", cancelProfileEdit);
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
}

// Global Order State for Confirmation Modal
let activeOrderData = {
  dishName: "",
  price: 0,
  dishId: 1,
  quantity: 1,
  category: "Snacks",
  description: ""
};

function ensureOrderModalExists() {
  if (document.getElementById("orderConfirmationModal")) return;

  const modalHtml = `
    <!-- ORDER DETAILS CONFIRMATION MODAL -->
    <div class="modal fade" id="orderConfirmationModal" tabindex="-1" aria-labelledby="orderModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow-lg border-0">
          <div class="modal-header bg-dark text-white">
            <h5 class="modal-title fw-bold text-warning" id="orderModalLabel">
              <i class="bi bi-bag-check-fill me-2"></i>Confirm Order Details
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <!-- Selected Dish Details -->
            <div class="p-3 bg-light rounded border mb-3">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 class="fw-bold mb-1 text-dark" id="modalDishName">Dish Name</h5>
                  <span class="badge bg-secondary mb-2" id="modalDishCategory">Category</span>
                  <p class="text-secondary small mb-0" id="modalDishDescription">Description</p>
                </div>
                <div class="text-end ms-2">
                  <span class="fs-4 fw-bold text-success" id="modalDishPrice">₹0</span>
                  <div class="text-muted small">unit price</div>
                </div>
              </div>
            </div>

            <!-- Quantity Selector -->
            <div class="row g-3 align-items-center mb-3">
              <div class="col-6">
                <label class="form-label fw-semibold mb-0"><i class="bi bi-plus-slash-minus me-1"></i>Quantity:</label>
              </div>
              <div class="col-6 d-flex align-items-center justify-content-end gap-2">
                <button type="button" class="btn btn-sm btn-outline-secondary px-3 fw-bold" onclick="adjustOrderQuantity(-1)">-</button>
                <input type="number" class="form-control form-control-sm text-center fw-bold" id="modalOrderQuantity" value="1" min="1" max="20" style="width: 65px;" readonly>
                <button type="button" class="btn btn-sm btn-outline-secondary px-3 fw-bold" onclick="adjustOrderQuantity(1)">+</button>
              </div>
            </div>

            <!-- Special Note / Location -->
            <div class="mb-3">
              <label for="modalOrderNotes" class="form-label fw-semibold"><i class="bi bi-pencil-square me-1"></i>Delivery / Pickup Note:</label>
              <input type="text" class="form-control form-control-sm" id="modalOrderNotes" placeholder="e.g. Counter Pickup, Deliver to IT Dept, etc.">
            </div>

            <!-- Payment Method -->
            <div class="mb-3">
              <label for="modalPaymentMethod" class="form-label fw-semibold"><i class="bi bi-wallet2 me-1"></i>Payment Option:</label>
              <select class="form-select form-select-sm" id="modalPaymentMethod">
                <option value="Cash on Delivery / Pickup" selected>Cash on Delivery / Counter Pickup</option>
                <option value="UPI / QR Payment">UPI / QR Code Scan</option>
                <option value="Student Meal Card">Student Campus Meal Card</option>
              </select>
            </div>

            <!-- Total Price Summary -->
            <div class="p-3 bg-warning-subtle border border-warning rounded d-flex justify-content-between align-items-center">
              <div>
                <span class="fw-bold text-dark d-block">Total Payable Price:</span>
                <small class="text-secondary" id="modalCustomerName">Customer: Rahul Sharma</small>
              </div>
              <span class="fs-3 fw-bold text-dark" id="modalTotalPrice">₹0</span>
            </div>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-canteen-primary fw-bold px-4" id="confirmPlaceOrderBtn" onclick="submitModalOrder()">
              <i class="bi bi-check-circle-fill me-1"></i> Confirm & Place Order
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SUCCESS NOTIFICATION MODAL -->
    <div class="modal fade" id="orderSuccessModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content text-center p-4 border-0 shadow-lg">
          <div class="mb-3 text-success">
            <i class="bi bi-check-circle-fill display-1"></i>
          </div>
          <h4 class="fw-bold mb-2 text-dark">Order Placed Successfully!</h4>
          <p class="text-secondary" id="successModalBodyText">Your order has been sent to the kitchen staff.</p>
          <div class="d-flex justify-content-center gap-2 mt-3">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Continue Ordering</button>
            <a href="student-dashboard.html" class="btn btn-canteen-primary fw-bold">
              <i class="bi bi-receipt me-1"></i> View My Order History
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

function placeOrder(dishName, price, dishId = 1, category = "Snacks", description = "") {
  ensureOrderModalExists();

  const user = getActiveUserSession() || { userId: 1, id: 1, name: "Rahul Sharma" };

  activeOrderData = {
    dishName: dishName,
    price: parseFloat(price) || 0,
    dishId: dishId,
    quantity: 1,
    category: category,
    description: description || "Freshly prepared campus canteen food item."
  };

  document.getElementById("modalDishName").textContent = activeOrderData.dishName;
  document.getElementById("modalDishCategory").textContent = activeOrderData.category;
  document.getElementById("modalDishDescription").textContent = activeOrderData.description;
  document.getElementById("modalDishPrice").textContent = `₹${activeOrderData.price}`;
  document.getElementById("modalOrderQuantity").value = 1;
  document.getElementById("modalTotalPrice").textContent = `₹${activeOrderData.price}`;
  document.getElementById("modalCustomerName").textContent = `Customer: ${user.name || 'Rahul Sharma'}`;
  document.getElementById("modalOrderNotes").value = "";

  const modalElem = document.getElementById("orderConfirmationModal");
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalElem);
  bsModal.show();
}

function adjustOrderQuantity(delta) {
  activeOrderData.quantity = Math.max(1, activeOrderData.quantity + delta);
  document.getElementById("modalOrderQuantity").value = activeOrderData.quantity;
  const totalPrice = activeOrderData.price * activeOrderData.quantity;
  document.getElementById("modalTotalPrice").textContent = `₹${totalPrice}`;
}

async function submitModalOrder() {
  const confirmBtn = document.getElementById("confirmPlaceOrderBtn");
  if (confirmBtn) confirmBtn.disabled = true;

  const user = getActiveUserSession() || { userId: 1, id: 1, name: "Rahul Sharma" };
  const qty = activeOrderData.quantity;
  const total = activeOrderData.price * qty;
  const notes = document.getElementById("modalOrderNotes")?.value.trim() || "";
  const paymentMethod = document.getElementById("modalPaymentMethod")?.value || "Cash on Delivery";

  let createdOrderId = 0;

  try {
    const formData = new URLSearchParams();
    formData.append("userId", user.userId || user.id || 1);
    formData.append("dishId", activeOrderData.dishId);
    formData.append("total", total);
    formData.append("quantity", qty);

    const response = await fetch(getOrderApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        createdOrderId = data.orderId;
      }
    }
  } catch (err) {
    console.warn("Backend order placement API unavailable, saving order locally:", err);
  }

  if (!createdOrderId) {
    // Fallback local id
    createdOrderId = 100 + (typeof orders !== "undefined" ? orders.length : 0) + Math.floor(Math.random() * 10) + 1;
  }

  // Close confirmation modal
  const confirmModalElem = document.getElementById("orderConfirmationModal");
  const bsConfirmModal = bootstrap.Modal.getInstance(confirmModalElem);
  if (bsConfirmModal) bsConfirmModal.hide();

  if (confirmBtn) confirmBtn.disabled = false;

  // Save pending single-order snapshot so payment page can show items
  const pending = [{ name: activeOrderData.dishName, quantity: activeOrderData.quantity, price: activeOrderData.price }];
  localStorage.setItem('pending_cart', JSON.stringify(pending));

  // Redirect to payment page to complete payment before showing success
  window.location.href = `payment.html?orderId=${createdOrderId}`;
}

function addToCartMock(dishName, price, dishId = 1) {
  addCartItem(dishName, price, dishId, 'Canteen Special', 'Added from homepage special feature.');
}

/**
 * Dynamically renders the Dashboard link & logged-in user profile dropdown in navbar
 */
function renderGlobalNavbarSession() {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return;

  try {
    const user = JSON.parse(userStr);
    if (!user || !user.name) return;

    // Update hero banner link if user is logged in
    const heroOrderBtn = document.querySelector(".hero-banner a[href='login.html']");
    if (heroOrderBtn) {
      heroOrderBtn.href = "menu.html";
    }

    // Resolve role-specific dashboard page
    let dashboardPage = "student-dashboard.html";
    if (user.role === "Manager" || user.role === "Administrator") {
      dashboardPage = "manager-dashboard.html";
    } else if (user.role === "Staff" || user.role === "Kitchen Staff" || user.role === "Delivery Staff" || user.role === "Cashier") {
      dashboardPage = "staff-dashboard.html";
    }

    const currentPath = window.location.pathname.split("/").pop();

    // 1. Add "Dashboard" link to navbar navigation list
    const navList = document.querySelector(".navbar-nav");
    if (navList && !document.getElementById("navDashboardLink")) {
      const isActive = currentPath === dashboardPage ? "active" : "";
      
      const li = document.createElement("li");
      li.className = "nav-item";
      li.id = "navDashboardLink";
      li.innerHTML = `<a class="nav-link ${isActive} fw-bold text-warning" href="${dashboardPage}"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a>`;
      
      if (navList.firstElementChild) {
        navList.insertBefore(li, navList.firstElementChild.nextSibling);
      } else {
        navList.appendChild(li);
      }
    }

    // 2. Replace static Login/Register buttons with Profile button when user is logged in
    const loginBtn = document.getElementById("loginLink");
    const registerBtn = document.getElementById("registerLink");
    const authButtons = document.getElementById("authButtons");

    if (registerBtn) {
      registerBtn.style.display = "none";
    }

    if (loginBtn && authButtons) {
      loginBtn.outerHTML = `
        <a id="profileLink" href="profile.html" class="btn btn-outline-warning btn-sm d-flex align-items-center gap-1">
          <i class="bi bi-person-circle fs-6"></i>
          <span>Profile</span>
        </a>
      `;
    }

    if (!loginBtn && authButtons && !document.getElementById("profileLink")) {
      const profileLink = document.createElement("a");
      profileLink.id = "profileLink";
      profileLink.href = "profile.html";
      profileLink.className = "btn btn-outline-warning btn-sm d-flex align-items-center gap-1";
      profileLink.innerHTML = `<i class="bi bi-person-circle fs-6"></i><span>Profile</span>`;
      authButtons.appendChild(profileLink);
    }

    if (registerBtn) {
      registerBtn.style.display = "none";
    }

    if (loginBtn) {
      loginBtn.style.display = "none";
    }
  } catch (e) {
    console.warn("Failed rendering global navbar session:", e);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach(link => {
    const linkPath = link.getAttribute("href");
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });

  updateCartCount();

  renderGlobalNavbarSession();
  if (currentPath === "profile.html") {
    renderProfilePage();
  }

  // Render role-specific navbar options on page load
  renderGlobalNavbarSession();
});

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

// --------------------------------------------------------------------------
// 2. HELPER & NAVBAR SESSION FUNCTIONS
// --------------------------------------------------------------------------

function showNotification(message, type = "info") {
  alert(`[${type.toUpperCase()}] ${message}`);
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
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return "http://localhost:8080/canteen/order" + queryString;
  }
  return "/canteen/order" + queryString;
}

function updateCartCount() {
  const cartBadge = document.getElementById("cart-count");
  if (cartBadge) {
    let current = parseInt(cartBadge.textContent || "0", 10);
    cartBadge.textContent = (current + 1).toString();
  }
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
    createdOrderId = 100 + (typeof orders !== "undefined" ? orders.length : 0) + Math.floor(Math.random() * 10) + 1;
  }

  const formattedDate = new Date().toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const newOrderObj = {
    id: createdOrderId,
    userId: user.userId || user.id || 1,
    studentName: user.name || "Rahul Sharma",
    items: `${activeOrderData.dishName} x ${qty}`,
    total: total,
    status: "New",
    date: formattedDate,
    notes: notes,
    paymentMethod: paymentMethod
  };

  // 1. Save to Local Storage for persistent order history across pages
  const savedLocalOrders = JSON.parse(localStorage.getItem("local_user_orders") || "[]");
  savedLocalOrders.unshift(newOrderObj);
  localStorage.setItem("local_user_orders", JSON.stringify(savedLocalOrders));

  // 2. Unshift into in-memory orders array
  if (typeof orders !== "undefined") {
    orders.unshift(newOrderObj);
  }

  // 3. Update Navbar cart counter
  updateCartCount(qty);

  // 4. Close confirmation modal
  const confirmModalElem = document.getElementById("orderConfirmationModal");
  const bsConfirmModal = bootstrap.Modal.getInstance(confirmModalElem);
  if (bsConfirmModal) bsConfirmModal.hide();

  if (confirmBtn) confirmBtn.disabled = false;

  // 5. Refresh Order History table if on student-dashboard
  if (typeof fetchStudentOrders === "function") {
    fetchStudentOrders();
  }

  // 6. Show Success Dialog
  document.getElementById("successModalBodyText").innerHTML = `
    <strong>Order #${newOrderObj.id}</strong> placed for <strong>${activeOrderData.dishName} (x${qty})</strong>.<br>
    Total Amount: <span class="fw-bold text-success">₹${total}</span>
  `;
  const successModalElem = document.getElementById("orderSuccessModal");
  const bsSuccessModal = bootstrap.Modal.getOrCreateInstance(successModalElem);
  bsSuccessModal.show();
}

function addToCartMock(dishName, price, dishId = 1) {
  placeOrder(dishName, price, dishId);
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

    // 2. Replace static Login button with User Profile dropdown
    const rightNavContainer = document.querySelector(".navbar .d-flex.align-items-center");
    if (rightNavContainer) {
      const loginBtn = rightNavContainer.querySelector("a[href='login.html']");
      if (loginBtn) {
        loginBtn.outerHTML = `
          <div class="dropdown d-inline-block ms-2">
            <button class="btn btn-outline-warning btn-sm dropdown-toggle d-flex align-items-center gap-1 fw-semibold" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle fs-6"></i>
              <span>${user.name}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li><h6 class="dropdown-header text-truncate">Role: ${user.role || 'User'}</h6></li>
              <li><a class="dropdown-item fw-bold text-dark" href="${dashboardPage}"><i class="bi bi-speedometer2 me-2 text-warning"></i>Dashboard</a></li>
              <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2"></i>My Profile</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="login.html" onclick="localStorage.clear(); sessionStorage.clear();"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
            </ul>
          </div>
        `;
      }
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

  const cartBadge = document.getElementById("cart-count");
  if (cartBadge) {
    cartBadge.textContent = "0";
  }

  // Render role-specific navbar options on page load
  renderGlobalNavbarSession();
});

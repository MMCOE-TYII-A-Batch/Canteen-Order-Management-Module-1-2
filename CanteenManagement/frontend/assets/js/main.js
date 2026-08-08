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

/**
 * Dynamically renders the Dashboard link & logged-in user profile dropdown in navbar
 */
function renderGlobalNavbarSession() {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return;

  try {
    const user = JSON.parse(userStr);
    if (!user || !user.name) return;

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

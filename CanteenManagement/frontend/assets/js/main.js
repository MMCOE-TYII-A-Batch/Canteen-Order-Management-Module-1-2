/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - MAIN JAVASCRIPT (main.js)
   --------------------------------------------------------------------------
   Educational Project - Global Mock Data & Helper Functions
   This script holds mock arrays for users, dishes, and orders to allow
   the frontend to run completely independent of any backend server.
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. MOCK DATASETS (Independent Client-Side State)
// --------------------------------------------------------------------------

// Array of registered users
const users = [
  { id: 1, name: "Rahul Sharma", email: "rahul@college.edu", role: "Student", department: "Computer Engg", status: "Active" },
  { id: 2, name: "Priya Patel", email: "priya@college.edu", role: "Student", department: "IT Engg", status: "Active" },
  { id: 3, name: "Sanjay Kumar", email: "sanjay@college.edu", role: "Manager", department: "Canteen Mgmt", status: "Active" },
  { id: 4, name: "Amit Verma", email: "amit@college.edu", role: "Staff", department: "Kitchen Staff", status: "Active" },
  { id: 5, name: "Ramesh Singh", email: "ramesh@college.edu", role: "Staff", department: "Delivery Staff", status: "Active" }
];

// Array of food dishes available in the canteen
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

// Array of order records
const orders = [
  { id: 101, studentName: "Rahul Sharma", items: "Veg Cheese Burger x 2", total: 160, status: "New", date: "2026-08-06 12:30 PM" },
  { id: 102, studentName: "Priya Patel", items: "Paneer Pizza x 1", total: 150, status: "Preparing", date: "2026-08-06 12:35 PM" },
  { id: 103, studentName: "Rahul Sharma", items: "Special Veg Thali x 1", total: 120, status: "Prepared", date: "2026-08-06 12:40 PM" },
  { id: 104, studentName: "Priya Patel", items: "Masala Dosa x 2", total: 120, status: "Ready For Delivery", date: "2026-08-06 12:45 PM" },
  { id: 105, studentName: "Rahul Sharma", items: "Cold Coffee x 2", total: 100, status: "Delivered", date: "2026-08-06 12:15 PM" }
];

// --------------------------------------------------------------------------
// 2. HELPER FUNCTIONS
// --------------------------------------------------------------------------

/**
 * Display a user-friendly browser alert notification
 * @param {string} message - Text message to present to user
 * @param {string} type - Notification category (e.g. success, info, warning)
 */
function showNotification(message, type = "info") {
  alert(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Automatically highlight active navbar link based on current page filename
 */
document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach(link => {
    const linkPath = link.getAttribute("href");
    if (linkPath === currentPath) {
      link.classList.add("active");
    }
  });

  // Display initial total cart items counter if element exists
  const cartBadge = document.getElementById("cart-count");
  if (cartBadge) {
    cartBadge.textContent = "0";
  }
});

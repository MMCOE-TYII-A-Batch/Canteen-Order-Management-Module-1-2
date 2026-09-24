/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - STUDENT DASHBOARD JS (student.js)
   --------------------------------------------------------------------------
   PART 3 INTEGRATION: Connects Order Placement & History to OrderServlet (/canteen/order)
   Dynamic User Profile Loading from Session / Local Storage
   ========================================================================== */

function getActiveUserSession() {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function loadLoggedInUserProfile() {
  const user = getActiveUserSession();
  if (user) {
    const navElem = document.getElementById("navUserName");
    const welcomeElem = document.getElementById("welcomeUserName");
    const detailElem = document.getElementById("welcomeUserDetail");

    if (navElem) navElem.textContent = user.name || "Student";
    if (welcomeElem) welcomeElem.textContent = user.name || "Student";
    if (detailElem && user.department) {
      detailElem.textContent = `Department: ${user.department} | Registered Role: ${user.role || 'Student'}`;
    }
  }
}

function getOrderApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/order${queryString}`;
  }
  return `${window.location.origin}${contextPath}/order${queryString}`;
}

async function fetchStudentOrders() {
  const tableBody = document.getElementById("studentOrderHistoryBody");
  if (!tableBody) return;

  const user = getActiveUserSession() || { userId: 1, id: 1, name: "Rahul Sharma" };
  const currentUserId = user.userId || user.id || 1;

  let apiOrders = [];
  try {
    const response = await fetch(getOrderApiUrl(`?userId=${currentUserId}`));
    if (response.ok) {
      apiOrders = await response.json();
    }
  } catch (err) {
    console.warn("Backend unavailable, using client-side orders fallback:", err);
  }

  const savedLocalOrders = JSON.parse(localStorage.getItem("local_user_orders") || "[]");
  const userLocalOrders = savedLocalOrders.filter(o => !o.userId || o.userId == currentUserId);

  const orderMap = new Map();
  userLocalOrders.forEach(o => orderMap.set(o.id, o));
  apiOrders.forEach(o => orderMap.set(o.id, o));
  if (orderMap.size === 0 && typeof orders !== "undefined") {
    orders.forEach(o => orderMap.set(o.id, o));
  }

  const combinedOrders = Array.from(orderMap.values()).sort((a, b) => b.id - a.id);
  renderStudentOrderTable(combinedOrders);
}

function renderStudentOrderTable(ordersList) {
  const tableBody = document.getElementById("studentOrderHistoryBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (ordersList.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='5' class='text-center text-muted py-3'>No recent orders found.</td></tr>";
    return;
  }

  ordersList.forEach(order => {
    let badgeClass = "bg-secondary";
    if (order.status === "New") badgeClass = "bg-primary";
    else if (order.status === "Preparing") badgeClass = "bg-warning text-dark";
    else if (order.status === "Prepared" || order.status === "Ready For Delivery") badgeClass = "bg-info text-dark";
    else if (order.status === "Delivered") badgeClass = "bg-success";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>#${order.id}</strong></td>
      <td>${order.items}</td>
      <td><span class="fw-bold text-success">₹${order.total}</span></td>
      <td><span class="badge ${badgeClass}">${order.status}</span></td>
      <td><small class="text-secondary">${order.date}</small></td>
    `;
    tableBody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  loadLoggedInUserProfile();
  fetchStudentOrders();
});

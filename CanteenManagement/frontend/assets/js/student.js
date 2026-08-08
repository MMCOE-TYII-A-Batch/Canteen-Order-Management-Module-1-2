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
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return "http://localhost:8080/canteen/order" + queryString;
  }
  return "/canteen/order" + queryString;
}

async function fetchStudentOrders() {
  const tableBody = document.getElementById("studentOrderHistoryBody");
  if (!tableBody) return;

  const user = getActiveUserSession() || { userId: 1, name: "Rahul Sharma" };

  try {
    const response = await fetch(getOrderApiUrl(`?userId=${user.userId}`));
    if (response.ok) {
      const ordersList = await response.json();
      renderStudentOrderTable(ordersList);
      return;
    }
  } catch (err) {
    console.warn("Backend unavailable, using client-side orders fallback:", err);
  }

  // Fallback to mock orders array
  renderStudentOrderTable(orders);
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
      <td>#${order.id}</td>
      <td>${order.items}</td>
      <td>₹${order.total}</td>
      <td><span class="badge ${badgeClass}">${order.status}</span></td>
      <td>${order.date}</td>
    `;
    tableBody.appendChild(row);
  });
}

async function placeOrder(dishName, price, dishId = 1) {
  const user = getActiveUserSession() || { userId: 1, name: "Rahul Sharma" };

  try {
    const formData = new URLSearchParams();
    formData.append("userId", user.userId);
    formData.append("dishId", dishId);
    formData.append("total", price);
    formData.append("quantity", 1);

    const response = await fetch(getOrderApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const data = await response.json();
    if (response.ok && data.status === "success") {
      showNotification(`Order #${data.orderId} placed successfully for ${dishName}!`, "success");
      fetchStudentOrders();
      return;
    }
  } catch (err) {
    console.warn("Backend order placement unavailable, simulating locally:", err);
  }

  // Local fallback
  const newOrderId = 100 + orders.length + 1;
  orders.unshift({
    id: newOrderId,
    studentName: user.name,
    items: `${dishName} x 1`,
    total: price,
    status: "New",
    date: new Date().toLocaleString()
  });
  showNotification(`[Simulation Mode] Order #${newOrderId} placed for ${dishName}!`, "info");
  fetchStudentOrders();
}

document.addEventListener("DOMContentLoaded", function () {
  loadLoggedInUserProfile();
  fetchStudentOrders();
});

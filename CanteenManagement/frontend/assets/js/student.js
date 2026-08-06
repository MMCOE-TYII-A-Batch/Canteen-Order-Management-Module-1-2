/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - STUDENT DASHBOARD JS (student.js)
   --------------------------------------------------------------------------
   Educational Project - Handles Student Dashboard features:
   - View Menu highlights
   - Place mock orders
   - Track order status
   - Render order history
   ========================================================================== */

/**
 * Render order history table for student
 */
function renderStudentOrderHistory() {
  const tableBody = document.getElementById("studentOrderHistoryBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  orders.forEach(order => {
    // Generate status badge color
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
      <td>
        <button class="btn btn-sm btn-outline-dark" onclick="trackOrderDetails(${order.id})">
          <i class="bi bi-geo-alt"></i> Track
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Simulate placing an order from the UI
 * @param {string} dishName - Name of dish to order
 * @param {number} price - Price of dish
 */
function placeOrder(dishName, price) {
  const newOrderId = 100 + orders.length + 1;
  const newOrder = {
    id: newOrderId,
    studentName: "Rahul Sharma",
    items: `${dishName} x 1`,
    total: price,
    status: "New",
    date: new Date().toLocaleString()
  };

  orders.push(newOrder);
  showNotification(`Order #${newOrderId} placed successfully for ${dishName}!`, "success");
  renderStudentOrderHistory();
}

/**
 * Show alert tracking order status
 * @param {number} orderId - ID of order to track
 */
function trackOrderDetails(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    showNotification(`Order #${order.id} Current Status: ${order.status}`, "info");
  } else {
    showNotification("Order not found!", "warning");
  }
}

/**
 * Initialize Student Dashboard on page load
 */
document.addEventListener("DOMContentLoaded", function () {
  renderStudentOrderHistory();
});

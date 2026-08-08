/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - STAFF DASHBOARD JS (staff.js)
   --------------------------------------------------------------------------
   PART 3 INTEGRATION: Connects Kitchen & Delivery queues to OrderServlet (/canteen/order)
   Dynamic Session User Profile Loading
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

function loadStaffUserProfile() {
  const user = getActiveUserSession();
  if (user) {
    const navElem = document.getElementById("staffNavName");
    const welcomeElem = document.getElementById("staffWelcomeName");
    const detailElem = document.getElementById("staffWelcomeDetail");

    if (navElem) navElem.textContent = user.name + (user.role ? ` (${user.role})` : "");
    if (welcomeElem) welcomeElem.textContent = user.name;
    if (detailElem && user.department) {
      detailElem.textContent = `Department: ${user.department} | Role: ${user.role || 'Staff'} | Operational Duty Center`;
    }
  }
}

async function fetchStaffOrders() {
  try {
    const response = await fetch("/canteen/order");
    if (response.ok) {
      const allOrders = await response.json();
      renderKitchenOrdersFromData(allOrders);
      renderDeliveryOrdersFromData(allOrders);
      return;
    }
  } catch (err) {
    console.warn("Backend unavailable, using staff orders mock fallback:", err);
  }

  renderKitchenOrdersFromData(orders);
  renderDeliveryOrdersFromData(orders);
}

function renderKitchenOrdersFromData(ordersList) {
  const newOrdersContainer = document.getElementById("kitchenNewOrders");
  const preparingOrdersContainer = document.getElementById("kitchenPreparingOrders");
  const preparedOrdersContainer = document.getElementById("kitchenPreparedOrders");

  if (!newOrdersContainer || !preparingOrdersContainer || !preparedOrdersContainer) return;

  newOrdersContainer.innerHTML = "";
  preparingOrdersContainer.innerHTML = "";
  preparedOrdersContainer.innerHTML = "";

  const newOrders = ordersList.filter(o => o.status === "New");
  if (newOrders.length === 0) {
    newOrdersContainer.innerHTML = "<p class='text-muted small'>No new orders pending.</p>";
  } else {
    newOrders.forEach(o => newOrdersContainer.appendChild(createKitchenCard(o, "Accept Order", "bg-primary", () => changeOrderStatus(o.id, "Preparing"))));
  }

  const preparingOrders = ordersList.filter(o => o.status === "Preparing");
  if (preparingOrders.length === 0) {
    preparingOrdersContainer.innerHTML = "<p class='text-muted small'>No orders currently preparing.</p>";
  } else {
    preparingOrders.forEach(o => preparingOrdersContainer.appendChild(createKitchenCard(o, "Mark Prepared", "bg-warning text-dark", () => changeOrderStatus(o.id, "Ready For Delivery"))));
  }

  const preparedOrders = ordersList.filter(o => o.status === "Prepared" || o.status === "Ready For Delivery");
  if (preparedOrders.length === 0) {
    preparedOrdersContainer.innerHTML = "<p class='text-muted small'>No prepared orders in kitchen queue.</p>";
  } else {
    preparedOrders.forEach(o => preparedOrdersContainer.appendChild(createKitchenCard(o, "Ready For Pickup", "bg-info text-dark", () => showNotification(`Order #${o.id} ready for delivery!`, "info"))));
  }
}

function createKitchenCard(order, buttonText, badgeClass, actionCallback) {
  const card = document.createElement("div");
  card.className = "card custom-card mb-3 p-3";
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="fw-bold mb-0">Order #${order.id}</h6>
      <span class="badge ${badgeClass}">${order.status}</span>
    </div>
    <p class="mb-1 text-secondary small"><strong>Student:</strong> ${order.studentName || 'Student'}</p>
    <p class="mb-2 text-dark"><strong>Items:</strong> ${order.items}</p>
    <button class="btn btn-sm btn-canteen-primary w-100" id="btn-k-${order.id}">${buttonText}</button>
  `;
  card.querySelector(`#btn-k-${order.id}`).addEventListener("click", actionCallback);
  return card;
}

function renderDeliveryOrdersFromData(ordersList) {
  const readyContainer = document.getElementById("deliveryReadyOrders");
  const assignedContainer = document.getElementById("deliveryAssignedOrders");
  const deliveredContainer = document.getElementById("deliveryDeliveredOrders");

  if (!readyContainer || !assignedContainer || !deliveredContainer) return;

  readyContainer.innerHTML = "";
  assignedContainer.innerHTML = "";
  deliveredContainer.innerHTML = "";

  const readyList = ordersList.filter(o => o.status === "Ready For Delivery" || o.status === "Prepared");
  if (readyList.length === 0) {
    readyContainer.innerHTML = "<p class='text-muted small'>No orders ready for pickup.</p>";
  } else {
    readyList.forEach(o => readyContainer.appendChild(createDeliveryCard(o, "Accept Delivery", "bg-info text-dark", () => changeOrderStatus(o.id, "Out For Delivery"))));
  }

  const assignedList = ordersList.filter(o => o.status === "Out For Delivery");
  if (assignedList.length === 0) {
    assignedContainer.innerHTML = "<p class='text-muted small'>No active deliveries in transit.</p>";
  } else {
    assignedList.forEach(o => assignedContainer.appendChild(createDeliveryCard(o, "Mark Delivered", "bg-warning text-dark", () => changeOrderStatus(o.id, "Delivered"))));
  }

  const deliveredList = ordersList.filter(o => o.status === "Delivered");
  if (deliveredList.length === 0) {
    deliveredContainer.innerHTML = "<p class='text-muted small'>No completed deliveries recorded.</p>";
  } else {
    deliveredList.forEach(order => {
      const card = document.createElement("div");
      card.className = "card custom-card mb-3 p-3 bg-light";
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="fw-bold mb-0">Order #${order.id}</h6>
          <span class="badge bg-success">Delivered</span>
        </div>
        <p class="mb-0 text-muted small mt-1">${order.items} - Total: ₹${order.total}</p>
      `;
      deliveredContainer.appendChild(card);
    });
  }
}

function createDeliveryCard(order, buttonText, badgeClass, actionCallback) {
  const card = document.createElement("div");
  card.className = "card custom-card mb-3 p-3";
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="fw-bold mb-0">Order #${order.id}</h6>
      <span class="badge ${badgeClass}">${order.status}</span>
    </div>
    <p class="mb-1 text-secondary small"><strong>Deliver To:</strong> ${order.studentName || 'Student'}</p>
    <p class="mb-2 text-dark"><strong>Items:</strong> ${order.items}</p>
    <button class="btn btn-sm btn-canteen-secondary w-100" id="btn-d-${order.id}">${buttonText}</button>
  `;
  card.querySelector(`#btn-d-${order.id}`).addEventListener("click", actionCallback);
  return card;
}

async function changeOrderStatus(orderId, newStatus) {
  try {
    const formData = new URLSearchParams();
    formData.append("action", "updateStatus");
    formData.append("orderId", orderId);
    formData.append("newStatus", newStatus);

    const response = await fetch("/canteen/order", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const data = await response.json();
    if (response.ok && data.status === "success") {
      showNotification(`Order #${orderId} status updated to ${newStatus}`, "success");
      fetchStaffOrders();
      return;
    }
  } catch (err) {
    console.warn("Backend unavailable, simulating status update locally:", err);
  }

  // Local fallback
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    showNotification(`[Simulation Mode] Order #${orderId} updated to ${newStatus}`, "info");
    fetchStaffOrders();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadStaffUserProfile();
  fetchStaffOrders();
});

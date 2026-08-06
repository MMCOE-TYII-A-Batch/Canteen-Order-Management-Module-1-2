/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - STAFF DASHBOARD JS (staff.js)
   --------------------------------------------------------------------------
   Educational Project - Kitchen & Delivery Staff Workflow State Machine:
   - Kitchen Workflow: New -> Preparing -> Prepared / Ready For Delivery
   - Delivery Workflow: Ready For Delivery -> Assigned -> Delivered
   Includes placeholders for Inventory Staff and Cashier modules.
   ========================================================================== */

/**
 * Render Kitchen Staff orders queues
 */
function renderKitchenOrders() {
  const newOrdersContainer = document.getElementById("kitchenNewOrders");
  const preparingOrdersContainer = document.getElementById("kitchenPreparingOrders");
  const preparedOrdersContainer = document.getElementById("kitchenPreparedOrders");

  if (!newOrdersContainer || !preparingOrdersContainer || !preparedOrdersContainer) return;

  // Clear existing containers
  newOrdersContainer.innerHTML = "";
  preparingOrdersContainer.innerHTML = "";
  preparedOrdersContainer.innerHTML = "";

  // 1. Render New Orders
  const newOrdersList = orders.filter(o => o.status === "New");
  if (newOrdersList.length === 0) {
    newOrdersContainer.innerHTML = "<p class='text-muted small'>No new orders pending.</p>";
  } else {
    newOrdersList.forEach(order => {
      newOrdersContainer.appendChild(createKitchenCard(order, "Accept Order", "bg-primary", () => updateOrderStatus(order.id, "Preparing")));
    });
  }

  // 2. Render Preparing Orders
  const preparingOrdersList = orders.filter(o => o.status === "Preparing");
  if (preparingOrdersList.length === 0) {
    preparingOrdersContainer.innerHTML = "<p class='text-muted small'>No orders currently preparing.</p>";
  } else {
    preparingOrdersList.forEach(order => {
      preparingOrdersContainer.appendChild(createKitchenCard(order, "Mark Prepared", "bg-warning text-dark", () => updateOrderStatus(order.id, "Ready For Delivery")));
    });
  }

  // 3. Render Prepared Orders (Ready to transfer to Delivery)
  const preparedOrdersList = orders.filter(o => o.status === "Prepared" || o.status === "Ready For Delivery");
  if (preparedOrdersList.length === 0) {
    preparedOrdersContainer.innerHTML = "<p class='text-muted small'>No prepared orders in kitchen queue.</p>";
  } else {
    preparedOrdersList.forEach(order => {
      preparedOrdersContainer.appendChild(createKitchenCard(order, "Handover to Delivery", "bg-info text-dark", () => showNotification(`Order #${order.id} sent to Delivery Queue!`, "info")));
    });
  }
}

/**
 * Helper to construct a Kitchen Card DOM element
 */
function createKitchenCard(order, buttonText, badgeClass, actionCallback) {
  const card = document.createElement("div");
  card.className = "card custom-card mb-3 p-3";
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="fw-bold mb-0">Order #${order.id}</h6>
      <span class="badge ${badgeClass}">${order.status}</span>
    </div>
    <p class="mb-1 text-secondary small"><strong>Student:</strong> ${order.studentName}</p>
    <p class="mb-2 text-dark"><strong>Items:</strong> ${order.items}</p>
    <button class="btn btn-sm btn-canteen-primary w-100" id="btn-kitchen-${order.id}">${buttonText}</button>
  `;
  card.querySelector(`#btn-kitchen-${order.id}`).addEventListener("click", actionCallback);
  return card;
}

/**
 * Render Delivery Staff orders queues
 */
function renderDeliveryOrders() {
  const readyContainer = document.getElementById("deliveryReadyOrders");
  const assignedContainer = document.getElementById("deliveryAssignedOrders");
  const deliveredContainer = document.getElementById("deliveryDeliveredOrders");

  if (!readyContainer || !assignedContainer || !deliveredContainer) return;

  readyContainer.innerHTML = "";
  assignedContainer.innerHTML = "";
  deliveredContainer.innerHTML = "";

  // 1. Ready for Delivery Queue
  const readyList = orders.filter(o => o.status === "Ready For Delivery" || o.status === "Prepared");
  if (readyList.length === 0) {
    readyContainer.innerHTML = "<p class='text-muted small'>No orders ready for pickup.</p>";
  } else {
    readyList.forEach(order => {
      readyContainer.appendChild(createDeliveryCard(order, "Accept Delivery", "bg-info text-dark", () => updateOrderStatus(order.id, "Out For Delivery")));
    });
  }

  // 2. Assigned / In-Transit Queue
  const assignedList = orders.filter(o => o.status === "Out For Delivery");
  if (assignedList.length === 0) {
    assignedContainer.innerHTML = "<p class='text-muted small'>No active deliveries in transit.</p>";
  } else {
    assignedList.forEach(order => {
      assignedContainer.appendChild(createDeliveryCard(order, "Mark Delivered", "bg-warning text-dark", () => updateOrderStatus(order.id, "Delivered")));
    });
  }

  // 3. Delivered Queue
  const deliveredList = orders.filter(o => o.status === "Delivered");
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

/**
 * Helper to construct a Delivery Card DOM element
 */
function createDeliveryCard(order, buttonText, badgeClass, actionCallback) {
  const card = document.createElement("div");
  card.className = "card custom-card mb-3 p-3";
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="fw-bold mb-0">Order #${order.id}</h6>
      <span class="badge ${badgeClass}">${order.status}</span>
    </div>
    <p class="mb-1 text-secondary small"><strong>Deliver To:</strong> ${order.studentName}</p>
    <p class="mb-2 text-dark"><strong>Items:</strong> ${order.items}</p>
    <button class="btn btn-sm btn-canteen-secondary w-100" id="btn-delivery-${order.id}">${buttonText}</button>
  `;
  card.querySelector(`#btn-delivery-${order.id}`).addEventListener("click", actionCallback);
  return card;
}

/**
 * Update order status and refresh Kitchen & Delivery dashboards
 * @param {number} orderId - Target order ID
 * @param {string} newStatus - New status value
 */
function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    showNotification(`Order #${order.id} status updated to: ${newStatus}`, "success");
    renderKitchenOrders();
    renderDeliveryOrders();
  }
}

/**
 * Initialize Staff Dashboard workflows on DOM Load
 */
document.addEventListener("DOMContentLoaded", function () {
  renderKitchenOrders();
  renderDeliveryOrders();
});

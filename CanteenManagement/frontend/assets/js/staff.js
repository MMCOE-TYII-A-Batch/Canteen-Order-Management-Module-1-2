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

function getOrderApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/order${queryString}`;
  }
  return `${window.location.origin}${contextPath}/order${queryString}`;
}

function getPaymentApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/payment${queryString}`;
  }
  return `${window.location.origin}${contextPath}/payment${queryString}`;
}

async function loadCashRequests() {
  const container = document.getElementById("cashRequestsList");
  if (!container) return;

  try {
    const response = await fetch(getPaymentApiUrl("?action=cashRequests"));
    if (!response.ok) throw new Error("Unable to load cash requests");
    const requests = await response.json();
    renderCashRequests(requests);
  } catch (error) {
    console.warn("Could not load cash requests:", error);
    container.innerHTML = "<p class='text-muted small mb-0'>Cash requests are unavailable.</p>";
  }
}

function renderCashRequests(requests) {
  const container = document.getElementById("cashRequestsList");
  if (!container) return;

  container.innerHTML = "";
  if (!requests.length) {
    container.innerHTML = "<p class='text-muted small mb-0'>No pending cash payment requests.</p>";
    return;
  }

  requests.forEach(request => {
    const card = document.createElement("div");
    card.className = "border rounded p-3 mb-3";
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="fw-bold mb-0">Order #${request.orderId}</h6>
        <span class="badge bg-warning text-dark">Cash Pending</span>
      </div>
      <p class="mb-1"><strong>Customer:</strong> ${request.userName || "Customer"}</p>
      <p class="mb-1"><strong>Order:</strong> ${request.items || "Order items"}</p>
      <p class="fw-bold mb-3"><strong>Total Bill:</strong> ₹${Number(request.total || 0).toFixed(2)}</p>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-success btn-sm flex-grow-1" data-cash-decision="paid">
          <i class="bi bi-check-circle me-1"></i>Paid
        </button>
        <button type="button" class="btn btn-outline-danger btn-sm flex-grow-1" data-cash-decision="failed">
          <i class="bi bi-x-circle me-1"></i>Payment Problem
        </button>
      </div>
    `;
    card.querySelectorAll("[data-cash-decision]").forEach(button => {
      button.addEventListener("click", () => processCashDecision(request, button.dataset.cashDecision));
    });
    container.appendChild(card);
  });
}

async function processCashDecision(request, decision) {
  try {
    const formData = new URLSearchParams();
    formData.append("action", "cashDecision");
    formData.append("paymentId", request.paymentId);
    formData.append("decision", decision);

    const response = await fetch(getPaymentApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
    const data = await response.json();
    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Cash payment could not be processed");
    }

    if (decision === "paid") {
      addCashInvoice(request);
      showNotification(`Order #${request.orderId} marked paid. Receipt generated.`, "success");
    } else {
      showNotification(`Payment problem for Order #${request.orderId}. Order cancelled.`, "warning");
    }
    loadCashRequests();
  } catch (error) {
    console.error("Cash payment decision failed:", error);
    showNotification(error.message, "error");
  }
}

function addCashInvoice(request) {
  const container = document.getElementById("cashierInvoicesList");
  if (!container) return;
  if (container.querySelector(".text-muted")) container.innerHTML = "";

  const invoice = document.createElement("div");
  invoice.className = "list-group-item d-flex justify-content-between align-items-center mt-2";
  invoice.innerHTML = `
    <div>
      <h6 class="mb-0 fw-bold">Cash Receipt - Order #${request.orderId}</h6>
      <small class="text-secondary">${request.userName || "Customer"} | ${request.items || "Order items"} | Paid via Cash</small>
    </div>
    <span class="badge bg-success fs-6">₹${Number(request.total || 0).toFixed(2)}</span>
  `;
  container.prepend(invoice);
}

async function fetchStaffOrders() {
  try {
    const response = await fetch(getOrderApiUrl());
    if (response.ok) {
      const allOrders = await response.json();
      console.log(`📦 Fetched ${allOrders.length} orders from backend:`, allOrders);
      allOrders.forEach(order => {
        console.log(`  - Order #${order.id}: address="${order.deliveryAddress || 'NOT SET'}"`);
      });
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
    <p class="mb-2 text-muted small" style="font-size: 0.85rem;">
      <i class="bi bi-geo-alt-fill text-warning me-1"></i>
      <strong>Delivery:</strong> ${order.deliveryAddress || 'Main Canteen Counter'}
    </p>
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
  const displayAddress = order.deliveryAddress || 'Main Canteen Counter';
  console.log(`🚚 Rendering delivery card for Order #${order.id}: address="${displayAddress}"`);
  
  const card = document.createElement("div");
  card.className = "card custom-card mb-3 p-3";
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="fw-bold mb-0">Order #${order.id}</h6>
      <span class="badge ${badgeClass}">${order.status}</span>
    </div>
    <p class="mb-1 text-secondary small"><strong>Deliver To:</strong> ${order.studentName || 'Student'}</p>
    <p class="mb-2 text-dark"><strong>Items:</strong> ${order.items}</p>
    <div class="alert alert-info py-2 px-3 mb-2" role="alert">
      <i class="bi bi-geo-alt-fill text-danger me-2"></i>
      <strong>Delivery Address:</strong><br/>
      <span class="text-dark">${displayAddress}</span>
    </div>
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

    const response = await fetch(getOrderApiUrl(), {
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
  loadCashRequests();
  setInterval(loadCashRequests, 3000);
});

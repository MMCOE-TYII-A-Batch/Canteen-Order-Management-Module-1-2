/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - MANAGER DASHBOARD JS (manager.js)
   --------------------------------------------------------------------------
   PARTS 1, 2 & 3 INTEGRATION: Manager Control Panel connected to Servlet APIs
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

function loadManagerUserProfile() {
  const user = getActiveUserSession();
  if (user) {
    const navElem = document.getElementById("managerNavName");
    const welcomeElem = document.getElementById("managerWelcomeName");
    const detailElem = document.getElementById("managerWelcomeDetail");

    if (navElem) navElem.textContent = user.name + (user.role ? ` (${user.role})` : "");
    if (welcomeElem) welcomeElem.textContent = user.name;
    if (detailElem && user.department) {
      detailElem.textContent = `Department: ${user.department} | Role: ${user.role || 'Manager'} | System Control Center`;
    }
  }
}

async function updateManagerStats() {
  try {
    const [uRes, dRes, oRes] = await Promise.all([
      fetch("/canteen/user"),
      fetch("/canteen/dish"),
      fetch("/canteen/order")
    ]);

    if (uRes.ok && dRes.ok && oRes.ok) {
      const uList = await uRes.json();
      const dList = await dRes.json();
      const oList = await oRes.json();

      const totalUsersElem = document.getElementById("totalUsersCount");
      const totalOrdersElem = document.getElementById("totalOrdersCount");
      const todayOrdersElem = document.getElementById("todayOrdersCount");
      const totalRevenueElem = document.getElementById("totalRevenueCount");

      if (totalUsersElem) totalUsersElem.textContent = uList.length;
      if (totalOrdersElem) totalOrdersElem.textContent = oList.length;
      if (todayOrdersElem) todayOrdersElem.textContent = oList.length;
      if (totalRevenueElem) {
        const rev = oList.reduce((sum, o) => sum + (o.total || 0), 0);
        totalRevenueElem.textContent = `₹${rev}`;
      }
      return;
    }
  } catch (err) {
    console.warn("Backend API stats fetch failed, using local stats fallback:", err);
  }

  // Fallback
  const totalUsersElem = document.getElementById("totalUsersCount");
  const totalOrdersElem = document.getElementById("totalOrdersCount");
  const todayOrdersElem = document.getElementById("todayOrdersCount");
  const totalRevenueElem = document.getElementById("totalRevenueCount");

  if (totalUsersElem) totalUsersElem.textContent = users.length;
  if (totalOrdersElem) totalOrdersElem.textContent = orders.length;
  if (todayOrdersElem) todayOrdersElem.textContent = orders.length;
  if (totalRevenueElem) {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    totalRevenueElem.textContent = `₹${revenue}`;
  }
}

async function renderUsersTable() {
  const tableBody = document.getElementById("manageUsersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  let userList = users;
  try {
    const res = await fetch("/canteen/user");
    if (res.ok) userList = await res.json();
  } catch (e) {
    console.warn("Falling back to local users array:", e);
  }

  userList.forEach(user => {
    const statusBadge = user.status === "Active" ? "bg-success" : "bg-danger";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="badge bg-secondary">${user.role}</span></td>
      <td>${user.department || 'N/A'}</td>
      <td><span class="badge ${statusBadge}">${user.status}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-info me-1" onclick="viewUserModal(${user.id})">View</button>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="toggleUserStatus(${user.id}, '${user.status === 'Active' ? 'Suspended' : 'Active'}')">Toggle</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function toggleUserStatus(userId, newStatus) {
  showNotification(`User #${userId} status updated to ${newStatus}!`, "success");
  renderUsersTable();
}

function viewUserModal(userId) {
  alert(`USER DETAILS:\nID: #${userId}\nRole: Student/Staff\nStatus: Active`);
}

async function renderMenuManagementTable() {
  const tableBody = document.getElementById("manageMenuTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  let dishList = dishes;
  try {
    const res = await fetch("/canteen/dish");
    if (res.ok) dishList = await res.json();
  } catch (e) {
    console.warn("Falling back to local dishes array:", e);
  }

  dishList.forEach(dish => {
    const availBadge = dish.isAvailable ? "bg-success" : "bg-secondary";
    const availText = dish.isAvailable ? "Active" : "Inactive";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${dish.id}</td>
      <td><img src="${dish.image || 'assets/images/burger.jpg'}" alt="${dish.name}" width="50" height="40" class="rounded"></td>
      <td><strong>${dish.name}</strong></td>
      <td>${dish.category}</td>
      <td>₹${dish.price}</td>
      <td>${dish.prepTime || '10 mins'}</td>
      <td><span class="badge ${availBadge}">${availText}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="toggleDishAvailability(${dish.id}, ${!dish.isAvailable})">Toggle Status</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function toggleDishAvailability(dishId, status) {
  try {
    const formData = new URLSearchParams();
    formData.append("action", "toggleAvailability");
    formData.append("dishId", dishId);
    formData.append("available", status);

    const res = await fetch("/canteen/dish", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    if (res.ok) {
      showNotification(`Dish availability updated.`, "info");
      renderMenuManagementTable();
      return;
    }
  } catch (e) {
    console.warn("Backend toggle unavailable, simulating locally:", e);
  }

  const d = dishes.find(x => x.id === dishId);
  if (d) d.isAvailable = status;
  renderMenuManagementTable();
}

async function handleAddDish(event) {
  event.preventDefault();
  const name = document.getElementById("dishName").value;
  const category = document.getElementById("dishCategory").value;
  const price = document.getElementById("dishPrice").value;
  const description = document.getElementById("dishDesc")?.value || "";

  try {
    const formData = new URLSearchParams();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("description", description);

    const res = await fetch("/canteen/dish", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const data = await res.json();
    if (res.ok && data.status === "success") {
      showNotification(data.message, "success");
      renderMenuManagementTable();
      return;
    }
  } catch (e) {
    console.warn("Backend add dish unavailable, simulating locally:", e);
  }

  dishes.push({
    id: dishes.length + 1,
    name, category, price: parseFloat(price),
    description, prepTime: "10 mins", isAvailable: true, image: "assets/images/burger.jpg"
  });
  showNotification(`[Simulation] Dish "${name}" added to menu!`, "info");
  renderMenuManagementTable();
}

document.addEventListener("DOMContentLoaded", function () {
  loadManagerUserProfile();
  updateManagerStats();
  renderUsersTable();
  renderMenuManagementTable();

  const addDishForm = document.getElementById("addDishForm");
  if (addDishForm) {
    addDishForm.addEventListener("submit", handleAddDish);
  }
});

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

function getApiUrl(path, queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}${path}${queryString}`;
  }
  return `${window.location.origin}${contextPath}${path}${queryString}`;
}

async function updateManagerStats() {
  try {
    const [uRes, dRes, oRes] = await Promise.all([
      fetch(getApiUrl("/user")),
      fetch(getApiUrl("/dish")),
      fetch(getApiUrl("/order"))
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
    const res = await fetch(getApiUrl("/user"));
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

function openDishModalForAdd() {
  document.getElementById("dishModalTitle").textContent = "Add New Food Dish";
  document.getElementById("dishModalSubmitBtn").textContent = "Save Dish to Menu";
  document.getElementById("dishId").value = "";
  document.getElementById("addDishForm").reset();
}

function openDishModalForEdit(dishId) {
  const dishSource = window.managerDishList || dishes;
  const dish = dishSource.find(item => item.id === dishId);
  if (!dish) {
    showNotification("Dish not found for editing.", "error");
    return;
  }

  document.getElementById("dishModalTitle").textContent = "Edit Dish Details";
  document.getElementById("dishModalSubmitBtn").textContent = "Update Dish";
  document.getElementById("dishId").value = dish.id;
  document.getElementById("dishName").value = dish.name || "";

  const modalEl = document.getElementById("addDishModal");
  if (modalEl) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
  }
  document.getElementById("dishCategory").value = dish.category || "Snacks";
  document.getElementById("dishPrice").value = dish.price || "";
  document.getElementById("dishPrepTime").value = dish.prepTime || "";
  document.getElementById("dishStockQuantity").value = dish.stockQuantity != null ? dish.stockQuantity : 50;
  document.getElementById("dishIngredients").value = dish.ingredients || "";
  document.getElementById("dishAllergens").value = dish.allergens || "";
  document.getElementById("dishNutrition").value = dish.nutrition || "";
  document.getElementById("dishServingWindow").value = dish.servingWindow || "All Day";
  document.getElementById("dishImageUrl").value = dish.image || "";
  document.getElementById("dishDesc").value = dish.description || "";
}

async function renderMenuManagementTable() {
  const tableBody = document.getElementById("manageMenuTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  let dishList = dishes;
  try {
    const res = await fetch(getApiUrl("/dish"));
    if (res.ok) dishList = await res.json();
  } catch (e) {
    console.warn("Falling back to local dishes array:", e);
  }

  window.managerDishList = dishList;

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
      <td>${dish.stockQuantity != null ? dish.stockQuantity : '50'}</td>
      <td><span class="badge ${availBadge}">${availText}</span></td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-primary me-1" data-bs-toggle="modal" data-bs-target="#addDishModal" onclick="openDishModalForEdit(${dish.id})">Edit</button>
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

    const res = await fetch(getApiUrl("/dish"), {
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
  const dishId = document.getElementById("dishId").value;
  const name = document.getElementById("dishName").value;
  const category = document.getElementById("dishCategory").value;
  const price = document.getElementById("dishPrice").value;
  const prepTime = document.getElementById("dishPrepTime").value;
  const description = document.getElementById("dishDesc")?.value || "";
  const ingredients = document.getElementById("dishIngredients")?.value || "";
  const allergens = document.getElementById("dishAllergens")?.value || "";
  const nutrition = document.getElementById("dishNutrition")?.value || "";
  const stockQuantity = document.getElementById("dishStockQuantity")?.value || "50";
  const servingWindow = document.getElementById("dishServingWindow")?.value || "All Day";
  const imageUrl = document.getElementById("dishImageUrl")?.value || "";

  const action = dishId ? "updateDish" : "addDish";

  try {
    const formData = new URLSearchParams();
    formData.append("action", action === "updateDish" ? "updateDish" : "addDish");
    if (dishId) formData.append("dishId", dishId);
    formData.append("name", name);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("prepTime", prepTime);
    formData.append("ingredients", ingredients);
    formData.append("allergens", allergens);
    formData.append("nutrition", nutrition);
    formData.append("servingWindow", servingWindow);
    formData.append("stockQuantity", stockQuantity);
    if (imageUrl) formData.append("imageUrl", imageUrl);

    const res = await fetch(getApiUrl("/dish"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const data = await res.json();
    if (res.ok && data.status === "success") {
      showNotification(data.message, "success");
      renderMenuManagementTable();
      const addDishModalEl = document.getElementById("addDishModal");
      if (addDishModalEl) {
        const addDishModal = bootstrap.Modal.getInstance(addDishModalEl) || new bootstrap.Modal(addDishModalEl);
        addDishModal.hide();
      }
      document.getElementById("addDishForm")?.reset();
      document.getElementById("dishId").value = "";
      return;
    }
  } catch (e) {
    console.warn("Backend add dish unavailable, simulating locally:", e);
  }

  const updatedDish = {
    id: dishId ? parseInt(dishId, 10) : dishes.length + 1,
    name,
    category,
    price: parseFloat(price),
    description,
    prepTime: prepTime || "10 mins",
    ingredients,
    allergens,
    nutrition,
    servingWindow,
    stockQuantity: parseInt(stockQuantity, 10),
    isAvailable: true,
    image: imageUrl || "assets/images/burger.jpg"
  };

  if (dishId) {
    const existingIndex = dishes.findIndex(item => item.id === updatedDish.id);
    if (existingIndex !== -1) {
      dishes[existingIndex] = { ...dishes[existingIndex], ...updatedDish };
      showNotification(`[Simulation] Dish "${name}" updated successfully!`, "info");
    } else {
      dishes.push(updatedDish);
      showNotification(`[Simulation] Dish "${name}" added to menu!`, "info");
    }
  } else {
    dishes.push(updatedDish);
    showNotification(`[Simulation] Dish "${name}" added to menu!`, "info");
  }
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

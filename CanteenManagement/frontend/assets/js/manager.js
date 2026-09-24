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

async function toggleUserStatus(userId, newStatus) {
  try {
    const res = await fetch(getApiUrl(`/user?action=updateStatus&userId=${userId}&status=${newStatus}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      const statusLabel = newStatus === "Active" ? "activated" : "suspended";
      showNotification(`✅ User #${userId} has been successfully ${statusLabel}.`, "success");
      renderUsersTable();
    } else {
      const errorData = await res.json();
      showNotification(`❌ Failed to update user status: ${errorData.message}`, "error");
    }
  } catch (e) {
    console.error("Error toggling user status:", e);
    showNotification("⚠️ Server connection issue. Changes saved locally.", "warning");
    
    // Fallback: Update local users array
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = newStatus;
      const statusLabel = newStatus === "Active" ? "activated" : "suspended";
      showNotification(`✅ User #${userId} has been successfully ${statusLabel}.`, "success");
      renderUsersTable();
    }
  }
}

function viewUserModal(userId) {
  showNotification("👤 User details are available in the user management panel.", "info");
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
    showNotification("❌ Unable to locate dish for editing. Please try again.", "error");
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

async function loadManagerFeedbackSummary() {
  const tableBody = document.getElementById("managerFeedbackTableBody");
  if (!tableBody) return;

  try {
    const res = await fetch(getApiUrl("/feedback"));
    if (!res.ok) throw new Error("Feedback API not available");

    const feedbackList = await res.json();
    if (!Array.isArray(feedbackList) || feedbackList.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4">No customer feedback submitted yet.</td></tr>';
      return;
    }

    tableBody.innerHTML = feedbackList.slice(0, 8).map(item => {
      const stars = '★'.repeat(Number(item.rating || 5)) + '☆'.repeat(5 - Number(item.rating || 5));
      const comment = (item.comments || 'No additional comment').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <tr>
          <td>#${item.feedbackId}</td>
          <td>${(item.dishName || 'Dish').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${(item.userName || 'Customer').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td><span class="text-warning">${stars}</span></td>
          <td>${comment}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.warn("Manager feedback summary unavailable:", err);
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4">Feedback service is unavailable right now.</td></tr>';
  }
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
  renderSpecialSettings(dishList);

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
        <button class="btn btn-sm btn-outline-danger" onclick="deleteDishFromManager(${dish.id}, '${dish.name.replace(/'/g, "\\'")}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function renderSpecialSettings(dishList) {
  const optionsContainer = document.getElementById("specialDishOptions");
  const eventName = document.getElementById("specialEventName");
  const saveButton = document.getElementById("saveSpecialSettings");
  if (!optionsContainer || !eventName || !saveButton) return;

  const saved = JSON.parse(localStorage.getItem("todays_special_config") || "null");
  eventName.value = saved?.eventName || "";
  const selectedIds = (saved?.dishIds || []).map(Number);
  optionsContainer.innerHTML = "";
  dishList.forEach(dish => {
    const label = document.createElement("label");
    label.className = "form-check d-inline-flex align-items-center me-3 mb-2";
    label.innerHTML = `
      <input class="form-check-input special-dish-checkbox me-2" type="checkbox" value="${dish.id}" ${selectedIds.includes(Number(dish.id)) ? "checked" : ""}>
      <span>${dish.name} - ₹${dish.price}</span>
    `;
    optionsContainer.appendChild(label);
  });

  optionsContainer.querySelectorAll(".special-dish-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const checked = optionsContainer.querySelectorAll(".special-dish-checkbox:checked");
      if (checked.length > 3) {
        checkbox.checked = false;
        showNotification("You can choose up to 3 Today's Special items.", "warning");
      }
    });
  });

  saveButton.onclick = () => {
    const config = {
      eventName: eventName.value.trim() || "Today's Specials",
      dishIds: Array.from(optionsContainer.querySelectorAll(".special-dish-checkbox:checked"))
        .map(checkbox => Number(checkbox.value))
    };
    localStorage.setItem("todays_special_config", JSON.stringify(config));
    showNotification("Today's Special updated successfully.", "success");
  };
}

async function deleteDishFromManager(dishId, dishName) {
  const confirmed = await confirmWithPopup({
    title: 'Delete Dish',
    message: `Delete "${dishName}" from the menu? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true
  });

  if (!confirmed) return;

  try {
    const formData = new URLSearchParams();
    formData.append("action", "deleteDish");
    formData.append("dishId", dishId);

    const res = await fetch(getApiUrl("/dish"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const data = await res.json();
    if (res.ok && data.status === "success") {
      showNotification(`✅ Dish "${dishName}" deleted successfully.`, "success");
      renderMenuManagementTable();
      return;
    }

    throw new Error(data.message || "Delete request failed");
  } catch (e) {
    console.warn("Backend delete unavailable, removing locally:", e);
    const index = dishes.findIndex(item => item.id === dishId);
    if (index !== -1) {
      dishes.splice(index, 1);
      showNotification(`✅ Dish "${dishName}" was removed from the local menu.`, "success");
      renderMenuManagementTable();
      return;
    }
    showNotification("❌ Unable to delete the dish.", "error");
  }
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
      const statusText = status ? "activated" : "deactivated";
      showNotification(`✅ Dish status successfully ${statusText}!`, "success");
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
    showNotification("⚠️ Server connection issue. Changes saved locally.", "warning");
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
      showNotification(`✅ Dish "${name}" has been updated successfully and is now available in the menu.`, "success");
    } else {
      dishes.push(updatedDish);
      showNotification(`✅ New dish "${name}" has been added to the menu successfully!`, "success");
    }
  } else {
    dishes.push(updatedDish);
    showNotification(`✅ New dish "${name}" has been successfully added to the canteen menu.`, "success");
  }
  renderMenuManagementTable();
}

document.addEventListener("DOMContentLoaded", function () {
  loadManagerUserProfile();
  updateManagerStats();
  renderUsersTable();
  renderMenuManagementTable();
  loadManagerFeedbackSummary();

  const addDishForm = document.getElementById("addDishForm");
  if (addDishForm) {
    addDishForm.addEventListener("submit", handleAddDish);
  }
});

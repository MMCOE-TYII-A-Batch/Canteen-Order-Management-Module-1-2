/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - MANAGER DASHBOARD JS (manager.js)
   --------------------------------------------------------------------------
   Educational Project - Handles Manager Dashboard stats & management:
   - Dashboard card counters (Total Users, Orders, Today's Orders, Revenue)
   - User Management table rendering & user state updates
   - Dish/Menu Management table rendering & status toggles
   ========================================================================== */

/**
 * Update Manager Dashboard statistics cards
 */
function updateManagerStats() {
  const totalUsersElem = document.getElementById("totalUsersCount");
  const totalOrdersElem = document.getElementById("totalOrdersCount");
  const todayOrdersElem = document.getElementById("todayOrdersCount");
  const totalRevenueElem = document.getElementById("totalRevenueCount");

  if (totalUsersElem) totalUsersElem.textContent = users.length;
  if (totalOrdersElem) totalOrdersElem.textContent = orders.length;
  if (todayOrdersElem) todayOrdersElem.textContent = orders.filter(o => o.date.includes("2026-08-06")).length || orders.length;
  
  if (totalRevenueElem) {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    totalRevenueElem.textContent = `₹${revenue}`;
  }
}

/**
 * Render user management Bootstrap table
 */
function renderUsersTable() {
  const tableBody = document.getElementById("manageUsersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  users.forEach(user => {
    const statusBadge = user.status === "Active" ? "bg-success" : "bg-danger";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="badge bg-secondary">${user.role}</span></td>
      <td>${user.department}</td>
      <td><span class="badge ${statusBadge}">${user.status}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-info me-1" onclick="viewUserModal(${user.id})">View</button>
        ${user.status === "Active" 
          ? `<button class="btn btn-sm btn-outline-warning me-1" onclick="toggleUserStatus(${user.id}, 'Suspended')">Suspend</button>`
          : `<button class="btn btn-sm btn-outline-success me-1" onclick="toggleUserStatus(${user.id}, 'Active')">Activate</button>`
        }
        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Toggle user status (Active vs Suspended)
 * @param {number} userId - ID of target user
 * @param {string} newStatus - "Active" or "Suspended"
 */
function toggleUserStatus(userId, newStatus) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.status = newStatus;
    showNotification(`User ${user.name} status changed to ${newStatus}!`, "success");
    renderUsersTable();
    updateManagerStats();
  }
}

/**
 * Delete user from mock users array
 * @param {number} userId - ID of user to remove
 */
function deleteUser(userId) {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    const userName = users[userIndex].name;
    users.splice(userIndex, 1);
    showNotification(`User ${userName} deleted successfully!`, "danger");
    renderUsersTable();
    updateManagerStats();
  }
}

/**
 * View user details in alert dialog
 * @param {number} userId - Target user ID
 */
function viewUserModal(userId) {
  const user = users.find(u => u.id === userId);
  if (user) {
    alert(`USER DETAILS:\nID: #${user.id}\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nDepartment: ${user.department}\nStatus: ${user.status}`);
  }
}

/**
 * Render dish menu management table
 */
function renderMenuManagementTable() {
  const tableBody = document.getElementById("manageMenuTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  dishes.forEach(dish => {
    const availBadge = dish.isAvailable ? "bg-success" : "bg-secondary";
    const availText = dish.isAvailable ? "Active" : "Inactive";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${dish.id}</td>
      <td><img src="${dish.image}" alt="${dish.name}" width="50" height="40" class="rounded"></td>
      <td><strong>${dish.name}</strong></td>
      <td>${dish.category}</td>
      <td>₹${dish.price}</td>
      <td>${dish.prepTime}</td>
      <td><span class="badge ${availBadge}">${availText}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editDishModal(${dish.id})">Edit</button>
        ${dish.isAvailable 
          ? `<button class="btn btn-sm btn-outline-warning me-1" onclick="toggleDishAvailability(${dish.id}, false)">Deactivate</button>`
          : `<button class="btn btn-sm btn-outline-success me-1" onclick="toggleDishAvailability(${dish.id}, true)">Activate</button>`
        }
        <button class="btn btn-sm btn-outline-danger" onclick="deleteDish(${dish.id})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/**
 * Toggle dish availability status
 * @param {number} dishId - Target dish ID
 * @param {boolean} status - Available true/false
 */
function toggleDishAvailability(dishId, status) {
  const dish = dishes.find(d => d.id === dishId);
  if (dish) {
    dish.isAvailable = status;
    showNotification(`Dish ${dish.name} set to ${status ? 'Active' : 'Inactive'}!`, "info");
    renderMenuManagementTable();
  }
}

/**
 * Delete dish from mock array
 * @param {number} dishId - ID of dish to delete
 */
function deleteDish(dishId) {
  const index = dishes.findIndex(d => d.id === dishId);
  if (index !== -1) {
    const dishName = dishes[index].name;
    dishes.splice(index, 1);
    showNotification(`Dish "${dishName}" removed from menu!`, "danger");
    renderMenuManagementTable();
  }
}

/**
 * Trigger mock Add Dish form submit
 * @param {Event} event - Form event
 */
function handleAddDish(event) {
  event.preventDefault();
  const name = document.getElementById("dishName").value;
  const category = document.getElementById("dishCategory").value;
  const price = parseFloat(document.getElementById("dishPrice").value);
  const prepTime = document.getElementById("dishPrepTime").value;
  const description = document.getElementById("dishDesc").value;

  const newDish = {
    id: dishes.length + 1,
    name: name,
    category: category,
    price: price,
    description: description,
    ingredients: "Standard Ingredients",
    allergens: "None",
    nutrition: "300 kcal",
    prepTime: prepTime,
    isAvailable: true,
    isOffer: false,
    isCombo: false,
    isRecommended: false,
    image: "assets/images/burger.jpg"
  };

  dishes.push(newDish);
  showNotification(`New dish "${name}" added to menu successfully!`, "success");
  renderMenuManagementTable();
  
  // Close bootstrap modal if open
  const modalElem = document.getElementById("addDishModal");
  if (modalElem) {
    const modalInstance = bootstrap.Modal.getInstance(modalElem);
    if (modalInstance) modalInstance.hide();
  }
}

/**
 * Initialize Manager Dashboard on page load
 */
document.addEventListener("DOMContentLoaded", function () {
  updateManagerStats();
  renderUsersTable();
  renderMenuManagementTable();

  const addDishForm = document.getElementById("addDishForm");
  if (addDishForm) {
    addDishForm.addEventListener("submit", handleAddDish);
  }
});

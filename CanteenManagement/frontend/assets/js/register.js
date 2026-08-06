/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - REGISTER JAVASCRIPT (register.js)
   --------------------------------------------------------------------------
   Educational Project - Handles user registration simulation.
   Validates password match and adds the user to the local mock users array.
   ========================================================================== */

/**
 * Handles the registration form submission logic
 * @param {Event} event - HTML form submit event
 */
function handleRegister(event) {
  // Prevent form submission from reloading page
  event.preventDefault();

  // Retrieve values from input elements
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const idNumber = document.getElementById("regIdNumber").value.trim();
  const department = document.getElementById("regDepartment").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const role = document.getElementById("regRole").value;

  // Simple validation checks
  if (!name || !email || !phone || !idNumber || !department || !password || !confirmPassword || !role) {
    showNotification("Please fill in all registration fields!", "warning");
    return;
  }

  if (password !== confirmPassword) {
    showNotification("Passwords do not match! Please check again.", "warning");
    return;
  }

  // Create new user object and add to mock users array
  const newUser = {
    id: users.length + 1,
    name: name,
    email: email,
    role: role,
    department: department,
    status: "Active"
  };

  users.push(newUser);

  // Success alert
  showNotification(`Registration successful for ${name} (${role})! Please log in.`, "success");

  // Redirect to login page
  window.location.href = "login.html";
}

/**
 * Attach event listener on DOM load
 */
document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
});

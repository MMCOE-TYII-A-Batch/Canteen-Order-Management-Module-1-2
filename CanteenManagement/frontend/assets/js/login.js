/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - LOGIN JAVASCRIPT (login.js)
   --------------------------------------------------------------------------
   Educational Project - Handles user authentication simulations.
   Redirects users to their specific dashboard based on selected role:
   - Student -> student-dashboard.html
   - Manager -> manager-dashboard.html
   - Staff   -> staff-dashboard.html
   ========================================================================== */

/**
 * Handles the login form submission logic
 * @param {Event} event - HTML form submit event
 */
function handleLogin(event) {
  // Prevent page refresh on form submit
  event.preventDefault();

  // Get input field values
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const role = document.getElementById("loginRole").value;

  // Basic validation check
  if (!email || !password || !role) {
    showNotification("Please fill in all required fields!", "warning");
    return;
  }

  // Display success alert message
  showNotification(`Welcome back! Logged in successfully as ${role}.`, "success");

  // Redirect to appropriate dashboard based on selected role
  if (role === "Student") {
    window.location.href = "student-dashboard.html";
  } else if (role === "Manager") {
    window.location.href = "manager-dashboard.html";
  } else if (role === "Staff") {
    window.location.href = "staff-dashboard.html";
  } else {
    showNotification("Invalid role selected!", "warning");
  }
}

/**
 * Attach event listener when DOM content is loaded
 */
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});

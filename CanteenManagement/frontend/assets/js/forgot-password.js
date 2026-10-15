function getUserApiUrl() {
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return "http://localhost:8080/canteen/user";
  }
  return "/canteen/user";
}

function handleForgotPassword(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!email || !newPassword || !confirmPassword) {
    showNotification("Please complete all fields before resetting your password.", "warning");
    return;
  }

  if (newPassword !== confirmPassword) {
    showNotification("New password and confirmation must match.", "warning");
    return;
  }

  if (newPassword.length < 6) {
    showNotification("Password must be at least 6 characters long.", "warning");
    return;
  }

  fetch(getUserApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      action: "resetPassword",
      email: email,
      newPassword: newPassword
    }).toString()
  })
    .then(async response => {
      const data = await response.json();
      if (response.ok && data.status === "success") {
        showNotification(data.message || "Password updated successfully.", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1200);
      } else {
        showNotification(data.message || "Unable to reset password.", "error");
      }
    })
    .catch(error => {
      console.error("Password reset error:", error);
      showNotification("Could not reach the server. Ensure Tomcat is running.", "error");
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("forgotPasswordForm");
  if (form) {
    form.addEventListener("submit", handleForgotPassword);
  }
});

/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - LOGIN JAVASCRIPT (login.js)
   --------------------------------------------------------------------------
   PART 1 INTEGRATION: Connects login UI to Java LoginServlet (/canteen/login)
   Saves persistent login token in localStorage & sessionStorage
   ========================================================================== */

function getLoginApiUrl() {
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return "http://localhost:8080/canteen/login";
  }
  return "/canteen/login";
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const role = document.getElementById("loginRole").value;

  if (!email || !password || !role) {
    showNotification("Please fill in all required fields!", "warning");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);

    const apiUrl = getLoginApiUrl();
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      // Store in both localStorage and sessionStorage for persistent login
      localStorage.setItem("user", JSON.stringify(data));
      sessionStorage.setItem("user", JSON.stringify(data));

      showNotification(`Welcome back, ${data.name}! Logged in as ${data.role}.`, "success");

      setTimeout(() => {
        if (data.role === "Student" || data.role === "Customer") {
          window.location.href = "student-dashboard.html";
        } else if (data.role === "Manager" || data.role === "Administrator") {
          window.location.href = "manager-dashboard.html";
        } else {
          window.location.href = "staff-dashboard.html";
        }
      }, 1000);
    } else {
      showNotification(data.message || "Login failed! Please check credentials.", "warning");
    }
  } catch (error) {
    console.error("Login API error:", error);
    showNotification("Failed to connect to backend server. Check Tomcat server at http://localhost:8080.", "warning");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});

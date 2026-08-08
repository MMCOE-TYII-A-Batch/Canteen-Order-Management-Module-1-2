/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - REGISTER JAVASCRIPT (register.js)
   --------------------------------------------------------------------------
   PART 1 INTEGRATION: Connects registration form to RegisterServlet (/canteen/register)
   Strictly enforces @mmcoe.edu.in email domain restriction.
   ========================================================================== */

function getRegisterApiUrl() {
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return "http://localhost:8080/canteen/register";
  }
  return "/canteen/register";
}

async function handleRegister(event) {
  event.preventDefault();

  const nameElem = document.getElementById("regName");
  const emailElem = document.getElementById("regEmail");
  const phoneElem = document.getElementById("regPhone");
  const idNumberElem = document.getElementById("regIdNumber") || document.getElementById("regId");
  const deptElem = document.getElementById("regDepartment") || document.getElementById("regDept");
  const roleElem = document.getElementById("regRole");
  const passwordElem = document.getElementById("regPassword");
  const confirmPassElem = document.getElementById("regConfirmPassword");

  const name = nameElem ? nameElem.value.trim() : "";
  const email = emailElem ? emailElem.value.trim() : "";
  const phone = phoneElem ? phoneElem.value.trim() : "";
  const idNumber = idNumberElem ? idNumberElem.value.trim() : "";
  const department = deptElem ? deptElem.value.trim() : "";
  const role = roleElem ? roleElem.value : "Student";
  const password = passwordElem ? passwordElem.value : "";
  const confirmPassword = confirmPassElem ? confirmPassElem.value : "";

  if (!name || !email || !phone || !password) {
    showNotification("Please complete all required fields!", "warning");
    return;
  }

  // 1. STRICT EMAIL DOMAIN VALIDATION: Only allow @mmcoe.edu.in
  if (!email.toLowerCase().endsWith("@mmcoe.edu.in")) {
    showNotification("Only official college emails ending with @mmcoe.edu.in are allowed!", "warning");
    return;
  }

  // 2. PASSWORD CONFIRMATION CHECK
  if (confirmPassword && password !== confirmPassword) {
    showNotification("Passwords do not match! Please check again.", "warning");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("idNumber", idNumber);
    formData.append("department", department);
    formData.append("password", password);
    formData.append("role", role || "Student");

    const apiUrl = getRegisterApiUrl();
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      showNotification("Registration successful! Redirecting to login...", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    } else {
      showNotification(data.message || "Registration failed.", "warning");
    }
  } catch (error) {
    console.error("Registration API call error:", error);
    showNotification("Failed to connect to MySQL backend server. Ensure Tomcat is running at http://localhost:8080.", "warning");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const regForm = document.getElementById("registerForm");
  if (regForm) {
    regForm.addEventListener("submit", handleRegister);
  }
});

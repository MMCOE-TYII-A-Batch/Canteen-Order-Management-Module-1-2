/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - REGISTER SERVLET (RegisterServlet.java)
   --------------------------------------------------------------------------
   PART 1 INTEGRATION: User Registration via JDBC & MySQL Database
   Strictly enforces @mmcoe.edu.in email domain & exact Role Resolution (Student, Staff, Manager)
   ========================================================================== */

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<h2>RegisterServlet API is Active!</h2>");
        out.println("<p>Submit POST request from registration form at <a href='frontend/register.html'>register.html</a>.</p>");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String phone = request.getParameter("phone");
        String collegeId = request.getParameter("idNumber");
        String department = request.getParameter("department");
        String password = request.getParameter("password");
        String selectedRole = request.getParameter("role");

        if (name == null || email == null || phone == null || password == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Missing required registration details.\"}");
            return;
        }

        if (!email.toLowerCase().endsWith("@mmcoe.edu.in")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Only official emails ending with @mmcoe.edu.in are allowed!\"}");
            return;
        }

        if (selectedRole == null || selectedRole.isEmpty()) {
            selectedRole = "Student";
        }

        String getRoleIdSql = "SELECT role_id FROM roles WHERE LOWER(role_name) = LOWER(?) " +
                             "OR (LOWER(?) = 'student' AND LOWER(role_name) = 'customer') " +
                             "OR (LOWER(?) = 'staff' AND LOWER(role_name) = 'kitchen staff') LIMIT 1";
        
        String insertUserSql = "INSERT INTO users (name, email, phone, college_id, department, password, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            int roleId = 1; // Default fallback Customer
            try (PreparedStatement psRole = conn.prepareStatement(getRoleIdSql)) {
                psRole.setString(1, selectedRole);
                psRole.setString(2, selectedRole);
                psRole.setString(3, selectedRole);
                ResultSet rs = psRole.executeQuery();
                if (rs.next()) {
                    roleId = rs.getInt("role_id");
                }
            }

            try (PreparedStatement psInsert = conn.prepareStatement(insertUserSql)) {
                psInsert.setString(1, name);
                psInsert.setString(2, email);
                psInsert.setString(3, phone);
                psInsert.setString(4, collegeId != null ? collegeId : "N/A");
                psInsert.setString(5, department != null ? department : "General");
                psInsert.setString(6, password);
                psInsert.setInt(7, roleId);

                int rows = psInsert.executeUpdate();
                if (rows > 0) {
                    out.print("{\"status\":\"success\",\"message\":\"Registration successful for role: " + selectedRole + "! You can now log in.\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    out.print("{\"status\":\"error\",\"message\":\"Failed to create account.\"}");
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_CONFLICT);
            out.print("{\"status\":\"error\",\"message\":\"Email already registered or database error.\"}");
        }
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
}

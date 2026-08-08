/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - LOGIN SERVLET (LoginServlet.java)
   --------------------------------------------------------------------------
   PART 1 INTEGRATION: User Authentication & Strict Role Enforcement
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
import jakarta.servlet.http.HttpSession;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String selectedRole = request.getParameter("role");

        if (email == null || password == null || selectedRole == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"All fields are required.\"}");
            return;
        }

        String sql = "SELECT u.user_id, u.name, u.email, u.department, r.role_name, u.status " +
                     "FROM users u JOIN roles r ON u.role_id = r.role_id " +
                     "WHERE u.email = ? AND u.password = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, email);
            ps.setString(2, password);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                String dbRole = rs.getString("role_name");
                String status = rs.getString("status");
                String userName = rs.getString("name");
                String dept = rs.getString("department");
                int userId = rs.getInt("user_id");

                if ("Suspended".equalsIgnoreCase(status)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.print("{\"status\":\"error\",\"message\":\"Account is suspended. Contact Manager.\"}");
                    return;
                }

                // Strict Role Compatibility Verification
                boolean roleMatch = false;

                if ("Student".equalsIgnoreCase(selectedRole) && ("Customer".equalsIgnoreCase(dbRole) || "Student".equalsIgnoreCase(dbRole))) {
                    roleMatch = true;
                } else if ("Manager".equalsIgnoreCase(selectedRole) && ("Manager".equalsIgnoreCase(dbRole) || "Administrator".equalsIgnoreCase(dbRole))) {
                    roleMatch = true;
                } else if ("Staff".equalsIgnoreCase(selectedRole) && (dbRole.toLowerCase().contains("staff") || "Cashier".equalsIgnoreCase(dbRole) || "Staff".equalsIgnoreCase(dbRole))) {
                    roleMatch = true;
                } else if (selectedRole.equalsIgnoreCase(dbRole)) {
                    roleMatch = true;
                }

                if (!roleMatch) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    String readableDbRole = ("Customer".equalsIgnoreCase(dbRole)) ? "Student" : dbRole;
                    out.print("{\"status\":\"error\",\"message\":\"Role mismatch! Your account is registered as: " + readableDbRole + ". Please select " + readableDbRole + " to log in.\"}");
                    return;
                }

                // Create session
                HttpSession session = request.getSession();
                session.setAttribute("userId", userId);
                session.setAttribute("userName", userName);
                session.setAttribute("role", selectedRole);

                out.print("{\"status\":\"success\",\"message\":\"Login successful\",\"userId\":" + 
                          userId + ",\"name\":\"" + escapeJson(userName) + 
                          "\",\"department\":\"" + escapeJson(dept) + 
                          "\",\"role\":\"" + escapeJson(selectedRole) + "\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                out.print("{\"status\":\"error\",\"message\":\"Invalid email or password.\"}");
            }

        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\",\"message\":\"Database error occurred.\"}");
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("userId") != null) {
            out.print("{\"loggedIn\":true,\"name\":\"" + session.getAttribute("userName") + "\",\"role\":\"" + session.getAttribute("role") + "\"}");
        } else {
            out.print("{\"loggedIn\":false}");
        }
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"");
    }
}

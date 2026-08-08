/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - EXPANDED USER SERVLET (UserServlet.java)
   --------------------------------------------------------------------------
   PART 1 INTEGRATION: User & Role Management, RBAC, Profile Updates, Audit Trail
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

@WebServlet("/user")
public class UserServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String userIdStr = request.getParameter("id");
        String action = request.getParameter("action");

        if ("auditLogs".equalsIgnoreCase(action)) {
            // Fetch audit trail
            String sql = "SELECT a.log_id, u.name, a.action, a.details, a.created_at FROM audit_logs a LEFT JOIN users u ON a.user_id = u.user_id ORDER BY a.log_id DESC LIMIT 50";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                StringBuilder json = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    json.append("{")
                        .append("\"id\":").append(rs.getInt("log_id")).append(",")
                        .append("\"user\":\"").append(escapeJson(rs.getString("name"))).append("\",")
                        .append("\"action\":\"").append(escapeJson(rs.getString("action"))).append("\",")
                        .append("\"details\":\"").append(escapeJson(rs.getString("details"))).append("\",")
                        .append("\"timestamp\":\"").append(rs.getTimestamp("created_at").toString()).append("\"")
                        .append("}");
                    first = false;
                }
                json.append("]");
                out.print(json.toString());
                return;
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Database error\"}");
                return;
            }
        }

        if (userIdStr != null) {
            String sql = "SELECT u.user_id, u.name, u.email, u.phone, u.college_id, u.department, u.status, " +
                         "u.dietary_preferences, u.default_location, r.role_name " +
                         "FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, Integer.parseInt(userIdStr));
                ResultSet rs = ps.executeQuery();

                if (rs.next()) {
                    out.print("{\"user_id\":" + rs.getInt("user_id") +
                              ",\"name\":\"" + escapeJson(rs.getString("name")) + "\"" +
                              ",\"email\":\"" + escapeJson(rs.getString("email")) + "\"" +
                              ",\"phone\":\"" + escapeJson(rs.getString("phone")) + "\"" +
                              ",\"college_id\":\"" + escapeJson(rs.getString("college_id")) + "\"" +
                              ",\"department\":\"" + escapeJson(rs.getString("department")) + "\"" +
                              ",\"status\":\"" + escapeJson(rs.getString("status")) + "\"" +
                              ",\"dietaryPreferences\":\"" + escapeJson(rs.getString("dietary_preferences")) + "\"" +
                              ",\"defaultLocation\":\"" + escapeJson(rs.getString("default_location")) + "\"" +
                              ",\"role\":\"" + escapeJson(rs.getString("role_name")) + "\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"status\":\"error\",\"message\":\"User not found\"}");
                }
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Database error\"}");
            }
        } else {
            String sql = "SELECT u.user_id, u.name, u.email, u.phone, u.college_id, u.department, u.status, " +
                         "u.dietary_preferences, u.default_location, r.role_name " +
                         "FROM users u JOIN roles r ON u.role_id = r.role_id ORDER BY u.user_id ASC";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {

                StringBuilder json = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    json.append("{\"id\":").append(rs.getInt("user_id"))
                        .append(",\"name\":\"").append(escapeJson(rs.getString("name"))).append("\"")
                        .append(",\"email\":\"").append(escapeJson(rs.getString("email"))).append("\"")
                        .append(",\"phone\":\"").append(escapeJson(rs.getString("phone"))).append("\"")
                        .append(",\"role\":\"").append(escapeJson(rs.getString("role_name"))).append("\"")
                        .append(",\"department\":\"").append(escapeJson(rs.getString("department"))).append("\"")
                        .append(",\"dietaryPreferences\":\"").append(escapeJson(rs.getString("dietary_preferences"))).append("\"")
                        .append(",\"defaultLocation\":\"").append(escapeJson(rs.getString("default_location"))).append("\"")
                        .append(",\"status\":\"").append(escapeJson(rs.getString("status"))).append("\"}");
                    first = false;
                }
                json.append("]");
                out.print(json.toString());
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Database error\"}");
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        String userIdStr = request.getParameter("userId");

        if (userIdStr == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Missing userId parameter\"}");
            return;
        }

        int userId = Integer.parseInt(userIdStr);

        try (Connection conn = DBConnection.getConnection()) {
            if ("updateProfile".equalsIgnoreCase(action)) {
                String name = request.getParameter("name");
                String phone = request.getParameter("phone");
                String department = request.getParameter("department");
                String dietary = request.getParameter("dietaryPreferences");
                String location = request.getParameter("defaultLocation");

                String sql = "UPDATE users SET name=?, phone=?, department=?, dietary_preferences=?, default_location=? WHERE user_id=?";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, name);
                    ps.setString(2, phone);
                    ps.setString(3, department);
                    ps.setString(4, dietary != null ? dietary : "None");
                    ps.setString(5, location != null ? location : "Main Canteen Counter");
                    ps.setInt(6, userId);
                    ps.executeUpdate();
                }

                writeAuditLog(conn, userId, "PROFILE_UPDATE", "User updated profile details");
                out.print("{\"status\":\"success\",\"message\":\"Profile updated successfully!\"}");

            } else if ("updateStatus".equalsIgnoreCase(action)) {
                String newStatus = request.getParameter("status"); // Active / Suspended
                String sql = "UPDATE users SET status=? WHERE user_id=?";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, newStatus);
                    ps.setInt(2, userId);
                    ps.executeUpdate();
                }

                writeAuditLog(conn, userId, "STATUS_CHANGE", "Account status changed to " + newStatus);
                out.print("{\"status\":\"success\",\"message\":\"Account status updated to " + newStatus + "\"}");

            } else if ("deleteUser".equalsIgnoreCase(action)) {
                String sql = "DELETE FROM users WHERE user_id=?";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, userId);
                    ps.executeUpdate();
                }

                writeAuditLog(conn, userId, "ACCOUNT_DELETED", "User account ID #" + userId + " was deleted");
                out.print("{\"status\":\"success\",\"message\":\"User account deleted\"}");

            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"Unknown action\"}");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\",\"message\":\"Database error during profile action\"}");
        }
    }

    private void writeAuditLog(Connection conn, int userId, String action, String details) {
        String logSql = "INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(logSql)) {
            ps.setInt(1, userId);
            ps.setString(2, action);
            ps.setString(3, details);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}

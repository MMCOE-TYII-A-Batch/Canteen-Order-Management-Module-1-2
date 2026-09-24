/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - ADDRESS SERVLET (AddressServlet.java)
   --------------------------------------------------------------------------
   Manages User-Specific Delivery Addresses
   Allows users to save, retrieve, update, and delete delivery addresses
   ========================================================================== */

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/address")
public class AddressServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        String userIdStr = request.getParameter("userId");

        if (userIdStr == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"userId parameter required\"}");
            return;
        }

        try {
            int userId = Integer.parseInt(userIdStr);

            if ("listAddresses".equalsIgnoreCase(action)) {
                listUserAddresses(out, userId);
                return;
            }

            out.print("{\"status\":\"error\",\"message\":\"Unknown action\"}");
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Invalid userId format\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        String userIdStr = request.getParameter("userId");

        if (userIdStr == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"userId parameter required\"}");
            return;
        }

        try {
            int userId = Integer.parseInt(userIdStr);

            if ("saveAddress".equalsIgnoreCase(action)) {
                saveAddress(out, userId, request);
                return;
            }

            if ("setDefaultAddress".equalsIgnoreCase(action)) {
                setDefaultAddress(out, userId, request);
                return;
            }

            out.print("{\"status\":\"error\",\"message\":\"Unknown action\"}");
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Invalid userId format\"}");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String addressIdStr = request.getParameter("addressId");
        String userIdStr = request.getParameter("userId");

        if (addressIdStr == null || userIdStr == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"addressId and userId required\"}");
            return;
        }

        try {
            int addressId = Integer.parseInt(addressIdStr);
            int userId = Integer.parseInt(userIdStr);
            deleteAddress(out, userId, addressId);
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Invalid ID format\"}");
        }
    }

    // List all saved addresses for a user
    private void listUserAddresses(PrintWriter out, int userId) {
        String sql = "SELECT address_id, address, is_default, usage_count, last_used FROM user_delivery_addresses WHERE user_id = ? ORDER BY is_default DESC, last_used DESC LIMIT 10";
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            
            StringBuilder json = new StringBuilder("[");
            boolean first = true;

            while (rs.next()) {
                if (!first) json.append(",");
                json.append("{")
                    .append("\"id\":").append(rs.getInt("address_id")).append(",")
                    .append("\"address\":\"").append(escapeJson(rs.getString("address"))).append("\",")
                    .append("\"isDefault\":").append(rs.getBoolean("is_default")).append(",")
                    .append("\"usageCount\":").append(rs.getInt("usage_count")).append(",")
                    .append("\"lastUsed\":\"").append(rs.getTimestamp("last_used")).append("\"")
                    .append("}");
                first = false;
            }

            json.append("]");
            out.print("{\"status\":\"success\",\"addresses\":" + json.toString() + "}");
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"status\":\"error\",\"message\":\"Database error listing addresses\"}");
        }
    }

    // Save a new address for user
    private void saveAddress(PrintWriter out, int userId, HttpServletRequest request) {
        String address = request.getParameter("address");

        if (address == null || address.trim().isEmpty()) {
            out.print("{\"status\":\"error\",\"message\":\"Address cannot be empty\"}");
            return;
        }

        String sql = "INSERT INTO user_delivery_addresses (user_id, address, is_default) VALUES (?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, userId);
            ps.setString(2, address.trim());
            
            // Check if this is the first address - if so, make it default
            String checkSql = "SELECT COUNT(*) as count FROM user_delivery_addresses WHERE user_id = ?";
            try (PreparedStatement checkPs = conn.prepareStatement(checkSql)) {
                checkPs.setInt(1, userId);
                ResultSet checkRs = checkPs.executeQuery();
                checkRs.next();
                boolean isFirstAddress = checkRs.getInt("count") == 0;
                ps.setBoolean(3, isFirstAddress);
            }

            ps.executeUpdate();
            
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) {
                int addressId = keys.getInt(1);
                out.print("{\"status\":\"success\",\"message\":\"Address saved successfully\",\"addressId\":" + addressId + "}");
            } else {
                out.print("{\"status\":\"success\",\"message\":\"Address saved/updated successfully\"}");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"status\":\"error\",\"message\":\"Database error saving address\"}");
        }
    }

    // Set an address as default for user
    private void setDefaultAddress(PrintWriter out, int userId, HttpServletRequest request) {
        String addressIdStr = request.getParameter("addressId");

        if (addressIdStr == null) {
            out.print("{\"status\":\"error\",\"message\":\"addressId required\"}");
            return;
        }

        try {
            int addressId = Integer.parseInt(addressIdStr);
            
            String sql1 = "UPDATE user_delivery_addresses SET is_default = FALSE WHERE user_id = ?";
            String sql2 = "UPDATE user_delivery_addresses SET is_default = TRUE WHERE address_id = ? AND user_id = ?";

            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps1 = conn.prepareStatement(sql1);
                 PreparedStatement ps2 = conn.prepareStatement(sql2)) {

                ps1.setInt(1, userId);
                ps1.executeUpdate();

                ps2.setInt(1, addressId);
                ps2.setInt(2, userId);
                int updated = ps2.executeUpdate();

                if (updated > 0) {
                    out.print("{\"status\":\"success\",\"message\":\"Default address updated\"}");
                } else {
                    out.print("{\"status\":\"error\",\"message\":\"Address not found or unauthorized\"}");
                }
            }
        } catch (NumberFormatException e) {
            out.print("{\"status\":\"error\",\"message\":\"Invalid addressId format\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"status\":\"error\",\"message\":\"Database error updating default address\"}");
        }
    }

    // Delete an address for user
    private void deleteAddress(PrintWriter out, int userId, int addressId) {
        String sql = "DELETE FROM user_delivery_addresses WHERE address_id = ? AND user_id = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, addressId);
            ps.setInt(2, userId);
            int deleted = ps.executeUpdate();

            if (deleted > 0) {
                out.print("{\"status\":\"success\",\"message\":\"Address deleted successfully\"}");
            } else {
                out.print("{\"status\":\"error\",\"message\":\"Address not found or unauthorized\"}");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"status\":\"error\",\"message\":\"Database error deleting address\"}");
        }
    }

    // Helper method to escape JSON strings
    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}

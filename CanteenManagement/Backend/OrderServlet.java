/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - ORDER SERVLET (OrderServlet.java)
   --------------------------------------------------------------------------
   PART 3 INTEGRATION: Order Processing & Kitchen/Delivery Queue State Machine
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

@WebServlet("/order")
public class OrderServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String userIdStr = request.getParameter("userId");
        String statusParam = request.getParameter("status");

        StringBuilder sql = new StringBuilder(
            "SELECT o.order_id, o.user_id, u.name AS student_name, o.total_amount, o.status, o.order_date, " +
            "COALESCE(o.delivery_address, 'Main Canteen Counter') AS delivery_address, " +
            "GROUP_CONCAT(CONCAT(d.name, ' x ', oi.quantity) SEPARATOR ', ') AS items " +
            "FROM orders o " +
            "JOIN users u ON o.user_id = u.user_id " +
            "LEFT JOIN order_items oi ON o.order_id = oi.order_id " +
            "LEFT JOIN dishes d ON oi.dish_id = d.dish_id "
        );

        if (userIdStr != null) {
            sql.append("WHERE o.user_id = ? ");
        } else if (statusParam != null && !statusParam.isEmpty()) {
            sql.append("WHERE o.status = ? ");
        }

        sql.append("GROUP BY o.order_id ORDER BY o.order_date DESC");

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            if (userIdStr != null) {
                ps.setInt(1, Integer.parseInt(userIdStr));
            } else if (statusParam != null && !statusParam.isEmpty()) {
                ps.setString(1, statusParam);
            }

            ResultSet rs = ps.executeQuery();
            StringBuilder json = new StringBuilder("[");
            boolean first = true;

            while (rs.next()) {
                if (!first) json.append(",");
                String itemsStr = rs.getString("items");
                if (itemsStr == null) itemsStr = "Custom Order";

                json.append("{")
                    .append("\"id\":").append(rs.getInt("order_id")).append(",")
                    .append("\"userId\":").append(rs.getInt("user_id")).append(",")
                    .append("\"studentName\":\"").append(escapeJson(rs.getString("student_name"))).append("\",")
                    .append("\"items\":\"").append(escapeJson(itemsStr)).append("\",")
                    .append("\"total\":").append(rs.getDouble("total_amount")).append(",")
                    .append("\"status\":\"").append(escapeJson(rs.getString("status"))).append("\",")
                    .append("\"deliveryAddress\":\"").append(escapeJson(rs.getString("delivery_address"))).append("\",")
                    .append("\"date\":\"").append(rs.getTimestamp("order_date").toString()).append("\"")
                    .append("}");
                first = false;
            }

            json.append("]");
            out.print(json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\",\"message\":\"Database error fetching orders.\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");

        // Action: Cancel/Delete Order within grace period
        if ("cancel".equalsIgnoreCase(action)) {
            String orderIdStr = request.getParameter("orderId");

            if (orderIdStr == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"Missing orderId\"}");
                return;
            }

            int orderId = Integer.parseInt(orderIdStr);
            System.out.println("[OrderServlet] 🗑️  Cancelling order ID: " + orderId);

            Connection conn = null;
            try {
                conn = DBConnection.getConnection();
                conn.setAutoCommit(false);

                // Delete order_items first (foreign key constraint)
                String deleteItemsSql = "DELETE FROM order_items WHERE order_id = ?";
                try (PreparedStatement psItems = conn.prepareStatement(deleteItemsSql)) {
                    psItems.setInt(1, orderId);
                    int itemsDeleted = psItems.executeUpdate();
                    System.out.println("[OrderServlet] ℹ️  Deleted " + itemsDeleted + " order items");
                }

                // Delete order
                String deleteOrderSql = "DELETE FROM orders WHERE order_id = ?";
                try (PreparedStatement psOrder = conn.prepareStatement(deleteOrderSql)) {
                    psOrder.setInt(1, orderId);
                    int orderDeleted = psOrder.executeUpdate();
                    if (orderDeleted > 0) {
                        conn.commit();
                        System.out.println("[OrderServlet] ✅ Order " + orderId + " cancelled and deleted");
                        out.print("{\"status\":\"success\",\"message\":\"Order cancelled successfully\",\"orderId\":" + orderId + "}");
                    } else {
                        conn.rollback();
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"status\":\"error\",\"message\":\"Order not found\"}");
                    }
                }
            } catch (SQLException e) {
                System.err.println("[OrderServlet] ❌ Error cancelling order: " + e.getMessage());
                try { if (conn != null) conn.rollback(); } catch (Exception ignore) {}
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Failed to cancel order\"}");
            } finally {
                try { if (conn != null) conn.close(); } catch (Exception ignore) {}
            }
            return;
        }

        // Action: Update Order Status (Kitchen & Delivery workflow)
        if ("updateStatus".equalsIgnoreCase(action)) {
            String orderIdStr = request.getParameter("orderId");
            String newStatus = request.getParameter("newStatus");

            if (orderIdStr == null || newStatus == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"Missing orderId or newStatus\"}");
                return;
            }

            String updateSql = "UPDATE orders SET status = ? WHERE order_id = ?";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, newStatus);
                ps.setInt(2, Integer.parseInt(orderIdStr));
                int count = ps.executeUpdate();

                if (count > 0) {
                    out.print("{\"status\":\"success\",\"message\":\"Order #" + orderIdStr + " updated to " + newStatus + "\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"status\":\"error\",\"message\":\"Order not found\"}");
                }
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Database error updating status\"}");
            }
            return;
        }

        // Action: Place New Order
        String userIdStr = request.getParameter("userId");
        String dishIdStr = request.getParameter("dishId");
        String totalStr = request.getParameter("total");
        String quantityStr = request.getParameter("quantity");
        String deliveryAddress = request.getParameter("deliveryAddress");

        int userId = userIdStr != null ? Integer.parseInt(userIdStr) : 1; // Default to student Rahul
        int dishId = dishIdStr != null ? Integer.parseInt(dishIdStr) : 1;
        double total = totalStr != null ? Double.parseDouble(totalStr) : 80.00;
        int qty = quantityStr != null ? Integer.parseInt(quantityStr) : 1;
        if (deliveryAddress == null || deliveryAddress.isEmpty()) {
            deliveryAddress = "Main Canteen Counter";
        }

        System.out.println("[OrderServlet] ℹ️ Creating order: userId=" + userId + ", dishId=" + dishId + ", quantity=" + qty + ", total=" + total + ", address=" + deliveryAddress);

        String insertOrderSql = "INSERT INTO orders (user_id, total_amount, delivery_address, status) VALUES (?, ?, ?, 'New')";
        String insertItemSql = "INSERT INTO order_items (order_id, dish_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)";
        String validateUserSql = "SELECT user_id FROM users WHERE user_id = ?";
        String validateDishSql = "SELECT dish_id, stock_quantity, is_available FROM dishes WHERE dish_id = ?";

        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            if (conn == null) {
                System.err.println("[OrderServlet] ❌ Database connection is NULL - check DB_URL, DB_USER, DB_PASSWORD");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Database connection failed. Check server logs.\"}");
                return;
            }

            setCorsHeaders(response);
            
            // Validate user exists
            try (PreparedStatement psValidateUser = conn.prepareStatement(validateUserSql)) {
                psValidateUser.setInt(1, userId);
                ResultSet userRs = psValidateUser.executeQuery();
                if (!userRs.next()) {
                    System.err.println("[OrderServlet] ❌ User ID " + userId + " does not exist in database");
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"status\":\"error\",\"message\":\"User ID " + userId + " not found. Please log in again.\"}");
                    return;
                }
            }
            
            // Validate dish exists and has stock available
            int availableStock = 0;
            boolean dishAvailable = true;
            try (PreparedStatement psValidateDish = conn.prepareStatement(validateDishSql)) {
                psValidateDish.setInt(1, dishId);
                ResultSet dishRs = psValidateDish.executeQuery();
                if (!dishRs.next()) {
                    System.err.println("[OrderServlet] ❌ Dish ID " + dishId + " does not exist in database");
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"status\":\"error\",\"message\":\"Dish ID " + dishId + " not found in menu.\"}");
                    return;
                }
                availableStock = dishRs.getInt("stock_quantity");
                dishAvailable = dishRs.getBoolean("is_available");
            }

            if (!dishAvailable || availableStock < qty) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"Not enough stock for this item. Available: " + availableStock + ", requested: " + qty + ".\"}");
                return;
            }

            conn.setAutoCommit(false); // Transaction

            int newOrderId = 0;
            try (PreparedStatement psOrder = conn.prepareStatement(insertOrderSql, Statement.RETURN_GENERATED_KEYS)) {
                psOrder.setInt(1, userId);
                psOrder.setDouble(2, total);
                psOrder.setString(3, deliveryAddress);
                int rowsAffected = psOrder.executeUpdate();
                System.out.println("[OrderServlet] ℹ️ Order insert affected " + rowsAffected + " row(s)");

                ResultSet rs = psOrder.getGeneratedKeys();
                if (rs.next()) {
                    newOrderId = rs.getInt(1);
                    System.out.println("[OrderServlet] ✅ Order created with ID=" + newOrderId);
                } else {
                    throw new SQLException("Failed to retrieve generated order ID");
                }
            }

            if (newOrderId > 0) {
                try (PreparedStatement psItem = conn.prepareStatement(insertItemSql)) {
                    psItem.setInt(1, newOrderId);
                    psItem.setInt(2, dishId);
                    psItem.setInt(3, qty);
                    psItem.setDouble(4, total / qty);
                    psItem.setDouble(5, total);
                    int itemRowsAffected = psItem.executeUpdate();
                    System.out.println("[OrderServlet] ℹ️ Order item insert affected " + itemRowsAffected + " row(s)");
                }

                String updateStockSql = "UPDATE dishes SET stock_quantity = stock_quantity - ?, is_available = CASE WHEN (stock_quantity - ?) > 0 THEN TRUE ELSE FALSE END WHERE dish_id = ?";
                try (PreparedStatement psStock = conn.prepareStatement(updateStockSql)) {
                    psStock.setInt(1, qty);
                    psStock.setInt(2, qty);
                    psStock.setInt(3, dishId);
                    int stockRowsAffected = psStock.executeUpdate();
                    System.out.println("[OrderServlet] ℹ️ Stock update affected " + stockRowsAffected + " row(s)");
                }
                conn.commit();
                System.out.println("[OrderServlet] ✅ Order committed successfully");
                out.print("{\"status\":\"success\",\"message\":\"Order placed successfully!\",\"orderId\":" + newOrderId + "}");
            } else {
                conn.rollback();
                System.err.println("[OrderServlet] ❌ Failed to get generated order ID");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Failed to create order - no ID generated.\"}");
            }
        } catch (SQLException e) {
            System.err.println("[OrderServlet] ❌ SQL Error: " + e.getMessage());
            System.err.println("[OrderServlet] Error Code: " + e.getErrorCode() + " | SQL State: " + e.getSQLState());
            e.printStackTrace();
            try { if (conn != null) conn.rollback(); } catch (Exception ignore) {}
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\",\"message\":\"Database error: " + escapeJson(e.getMessage()) + "\"}");
        } catch (NumberFormatException e) {
            System.err.println("[OrderServlet] ❌ Invalid number format: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Invalid parameters. Please check userId, dishId, total, and quantity are valid numbers.\"}");
        } catch (Exception e) {
            System.err.println("[OrderServlet] ❌ Unexpected error: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\",\"message\":\"Unexpected error: " + escapeJson(e.getMessage()) + "\"}");
        } finally {
            try { if (conn != null) conn.close(); } catch (Exception ignore) {}
        }
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}

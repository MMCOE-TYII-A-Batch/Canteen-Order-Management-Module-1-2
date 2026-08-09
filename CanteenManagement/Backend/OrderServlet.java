/*
 * ==========================================================================
 * PART 3 INTEGRATION: Order Processing & Kitchen/Delivery Queue State Machine
 * ==========================================================================
 */

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

    // ============================================================
    // GET ORDERS
    // Supports:
    // /canteen/order
    // /canteen/order?userId=1
    // /canteen/order?status=New
    // ============================================================
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String userIdStr = request.getParameter("userId");
        String statusParam = request.getParameter("status");

        StringBuilder sql = new StringBuilder(
                "SELECT o.order_id, o.user_id, u.name AS student_name, "
                + "o.total_amount, o.status, o.order_date, "
                + "GROUP_CONCAT(CONCAT(d.name, ' x ', oi.quantity) "
                + "SEPARATOR ', ') AS items "
                + "FROM orders o "
                + "JOIN users u ON o.user_id = u.user_id "
                + "LEFT JOIN order_items oi ON o.order_id = oi.order_id "
                + "LEFT JOIN dishes d ON oi.dish_id = d.dish_id "
        );

        if (userIdStr != null && !userIdStr.isEmpty()) {
            sql.append("WHERE o.user_id = ? ");
        } else if (statusParam != null && !statusParam.isEmpty()) {
            sql.append("WHERE o.status = ? ");
        }

        sql.append("GROUP BY o.order_id ORDER BY o.order_date DESC");

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            if (userIdStr != null && !userIdStr.isEmpty()) {
                ps.setInt(1, Integer.parseInt(userIdStr));
            } else if (statusParam != null && !statusParam.isEmpty()) {
                ps.setString(1, statusParam);
            }

            ResultSet rs = ps.executeQuery();

            StringBuilder json = new StringBuilder("[");
            boolean first = true;

            while (rs.next()) {

                if (!first) {
                    json.append(",");
                }

                String itemsStr = rs.getString("items");

                if (itemsStr == null) {
                    itemsStr = "Custom Order";
                }

                String orderDate = "";

                if (rs.getTimestamp("order_date") != null) {
                    orderDate = rs.getTimestamp("order_date").toString();
                }

                json.append("{")
                        .append("\"id\":")
                        .append(rs.getInt("order_id"))
                        .append(",")

                        .append("\"userId\":")
                        .append(rs.getInt("user_id"))
                        .append(",")

                        .append("\"studentName\":\"")
                        .append(escapeJson(rs.getString("student_name")))
                        .append("\",")

                        .append("\"items\":\"")
                        .append(escapeJson(itemsStr))
                        .append("\",")

                        .append("\"total\":")
                        .append(rs.getDouble("total_amount"))
                        .append(",")

                        .append("\"status\":\"")
                        .append(escapeJson(rs.getString("status")))
                        .append("\",")

                        .append("\"date\":\"")
                        .append(escapeJson(orderDate))
                        .append("\"")

                        .append("}");

                first = false;
            }

            json.append("]");

            out.print(json.toString());

        } catch (NumberFormatException e) {

            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

            out.print(
                    "{\"status\":\"error\",\"message\":\"Invalid userId.\"}"
            );

        } catch (SQLException e) {

            e.printStackTrace();

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            out.print(
                    "{\"status\":\"error\",\"message\":\"Database error fetching orders.\"}"
            );
        }
    }

    // ============================================================
    // POST
    // Supports:
    // 1. Place New Order
    // 2. Update Order Status
    // ============================================================
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");

        // ========================================================
        // ACTION 1: UPDATE ORDER STATUS
        // ========================================================
        if ("updateStatus".equalsIgnoreCase(action)) {

            String orderIdStr = request.getParameter("orderId");
            String newStatus = request.getParameter("newStatus");

            if (orderIdStr == null || orderIdStr.isEmpty()
                    || newStatus == null || newStatus.isEmpty()) {

                response.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST
                );

                out.print(
                        "{\"status\":\"error\","
                                + "\"message\":\"Missing orderId or newStatus\"}"
                );

                return;
            }

            String updateSql =
                    "UPDATE orders SET status = ? WHERE order_id = ?";

            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps =
                         conn.prepareStatement(updateSql)) {

                int orderId = Integer.parseInt(orderIdStr);

                ps.setString(1, newStatus);
                ps.setInt(2, orderId);

                int count = ps.executeUpdate();

                if (count > 0) {

                    out.print(
                            "{\"status\":\"success\","
                                    + "\"message\":\"Order #"
                                    + orderId
                                    + " updated to "
                                    + escapeJson(newStatus)
                                    + "\"}"
                    );

                } else {

                    response.setStatus(
                            HttpServletResponse.SC_NOT_FOUND
                    );

                    out.print(
                            "{\"status\":\"error\","
                                    + "\"message\":\"Order not found\"}"
                    );
                }

            } catch (NumberFormatException e) {

                response.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST
                );

                out.print(
                        "{\"status\":\"error\","
                                + "\"message\":\"Invalid orderId.\"}"
                );

            } catch (SQLException e) {

                e.printStackTrace();

                response.setStatus(
                        HttpServletResponse.SC_INTERNAL_SERVER_ERROR
                );

                out.print(
                        "{\"status\":\"error\","
                                + "\"message\":\"Database error updating status.\"}"
                );
            }

            return;
        }

        // ========================================================
        // ACTION 2: PLACE NEW ORDER
        // ========================================================

        String userIdStr = request.getParameter("userId");
        String dishIdStr = request.getParameter("dishId");
        String totalStr = request.getParameter("total");
        String quantityStr = request.getParameter("quantity");

        // Validate required parameters
        if (userIdStr == null || userIdStr.isEmpty()
                || dishIdStr == null || dishIdStr.isEmpty()
                || totalStr == null || totalStr.isEmpty()
                || quantityStr == null || quantityStr.isEmpty()) {

            response.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            out.print(
                    "{\"status\":\"error\","
                            + "\"message\":\"Missing required order details.\"}"
            );

            return;
        }

        int userId;
        int dishId;
        int quantity;
        double total;

        try {

            userId = Integer.parseInt(userIdStr);
            dishId = Integer.parseInt(dishIdStr);
            quantity = Integer.parseInt(quantityStr);
            total = Double.parseDouble(totalStr);

            if (userId <= 0 || dishId <= 0
                    || quantity <= 0 || total < 0) {

                throw new NumberFormatException();

            }

        } catch (NumberFormatException e) {

            response.setStatus(
                    HttpServletResponse.SC_BAD_REQUEST
            );

            out.print(
                    "{\"status\":\"error\","
                            + "\"message\":\"Invalid order details.\"}"
            );

            return;
        }

        // ========================================================
        // SQL QUERIES
        // ========================================================

        String insertOrderSql =
                "INSERT INTO orders "
                        + "(user_id, total_amount, status) "
                        + "VALUES (?, ?, 'New')";

        String insertItemSql =
                "INSERT INTO order_items "
                        + "(order_id, dish_id, quantity, unit_price, subtotal) "
                        + "VALUES (?, ?, ?, ?, ?)";

        // ========================================================
        // DATABASE TRANSACTION
        // ========================================================

        try (Connection conn = DBConnection.getConnection()) {

            conn.setAutoCommit(false);

            int newOrderId = 0;

            try {

                // ------------------------------------------------
                // Insert Order Master Record
                // ------------------------------------------------

                try (PreparedStatement psOrder =
                             conn.prepareStatement(
                                     insertOrderSql,
                                     Statement.RETURN_GENERATED_KEYS)) {

                    psOrder.setInt(1, userId);
                    psOrder.setDouble(2, total);

                    psOrder.executeUpdate();

                    try (ResultSet rs =
                                 psOrder.getGeneratedKeys()) {

                        if (rs.next()) {
                            newOrderId = rs.getInt(1);
                        }
                    }
                }

                // ------------------------------------------------
                // Insert Order Item
                // ------------------------------------------------

                if (newOrderId > 0) {

                    double unitPrice = total / quantity;

                    try (PreparedStatement psItem =
                                 conn.prepareStatement(insertItemSql)) {

                        psItem.setInt(1, newOrderId);
                        psItem.setInt(2, dishId);
                        psItem.setInt(3, quantity);
                        psItem.setDouble(4, unitPrice);
                        psItem.setDouble(5, total);

                        psItem.executeUpdate();
                    }

                    // Commit transaction
                    conn.commit();

                    out.print(
                            "{\"status\":\"success\","
                                    + "\"message\":\"Order placed successfully!\","
                                    + "\"orderId\":"
                                    + newOrderId
                                    + "}"
                    );

                } else {

                    conn.rollback();

                    response.setStatus(
                            HttpServletResponse.SC_INTERNAL_SERVER_ERROR
                    );

                    out.print(
                            "{\"status\":\"error\","
                                    + "\"message\":\"Failed to create order.\"}"
                    );
                }

            } catch (SQLException e) {

                conn.rollback();

                throw e;
            }

        } catch (SQLException e) {

            e.printStackTrace();

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            out.print(
                    "{\"status\":\"error\","
                            + "\"message\":\"Database transaction failed.\"}"
            );
        }
    }

    // ============================================================
    // JSON ESCAPE HELPER
    // ============================================================
    private String escapeJson(String input) {

        if (input == null) {
            return "";
        }

        return input
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
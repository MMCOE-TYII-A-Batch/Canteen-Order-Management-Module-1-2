import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.DecimalFormat;
import java.util.UUID;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/payment")
public class PaymentServlet extends HttpServlet {

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
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        if ("cashRequests".equalsIgnoreCase(action)) {
            listCashRequests(out);
            return;
        }

        if ("paymentStatus".equalsIgnoreCase(action)) {
            String paymentId = request.getParameter("paymentId");
            if (paymentId == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"paymentId required\"}");
                return;
            }
            sendPaymentStatus(out, Integer.parseInt(paymentId));
            return;
        }

        if ("listPayments".equalsIgnoreCase(action)) {
            listPayments(out);
            return;
        }

        if ("invoice".equalsIgnoreCase(action)) {
            String orderId = request.getParameter("orderId");
            if (orderId == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"orderId required\"}");
                return;
            }
            sendInvoice(out, Integer.parseInt(orderId));
            return;
        }

        out.print("{\"status\":\"error\",\"message\":\"Unknown action\"}");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");

        if ("initiate".equalsIgnoreCase(action)) {
            // Create a payment record and return a dummy payment URL / reference
            String orderIdStr = request.getParameter("orderId");
            String method = request.getParameter("method") == null ? "UPI" : request.getParameter("method");
            String amountStr = request.getParameter("amount");
            String deliveryAddress = request.getParameter("deliveryAddress");

            if (orderIdStr == null || amountStr == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"orderId and amount required\"}");
                return;
            }

            Connection conn = DBConnection.getConnection();
            if (conn == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"DB connection failed. Check DB_URL/credentials and that MySQL is running.\"}");
                return;
            }
            try {
                int orderId = Integer.parseInt(orderIdStr);
                
                // Update order with delivery address if provided
                if (deliveryAddress != null && !deliveryAddress.trim().isEmpty()) {
                    String updateOrderSql = "UPDATE orders SET delivery_address = ? WHERE order_id = ?";
                    try (PreparedStatement psUpdate = conn.prepareStatement(updateOrderSql)) {
                        psUpdate.setString(1, deliveryAddress.trim());
                        psUpdate.setInt(2, orderId);
                        psUpdate.executeUpdate();
                    }
                }
                
                String insertSql = "INSERT INTO payments (order_id, method, amount, currency, status, gateway_reference) VALUES (?, ?, ?, ?, 'PENDING', ?)";
                String gatewayRef = "DUMMY-" + UUID.randomUUID().toString();
                try (PreparedStatement ps = conn.prepareStatement(insertSql, PreparedStatement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, orderId);
                    ps.setString(2, method);
                    ps.setDouble(3, Double.parseDouble(amountStr));
                    ps.setString(4, "INR");
                    ps.setString(5, gatewayRef);
                    ps.executeUpdate();
                    ResultSet keys = ps.getGeneratedKeys();
                    if (keys.next()) {
                        int paymentId = keys.getInt(1);
                        // Return a dummy payment URL (in real flow redirect to gateway)
                        out.print("{\"status\":\"success\",\"paymentId\":" + paymentId + ",\"gatewayUrl\":\"/canteen/payment?action=callback&paymentId=" + paymentId + "&result=success\"}");
                        return;
                    }
                }
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"DB error initiating payment: " + escapeJson(e.getMessage()) + "\"}");
                return;
            } finally {
                try { conn.close(); } catch (Exception ignore) {}
            }
        }

        if ("cashDecision".equalsIgnoreCase(action)) {
            String paymentIdStr = request.getParameter("paymentId");
            String decision = request.getParameter("decision");
            if (paymentIdStr == null || decision == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"paymentId and decision required\"}");
                return;
            }

            int paymentId = Integer.parseInt(paymentIdStr);
            boolean paid = "paid".equalsIgnoreCase(decision);
            Connection conn = DBConnection.getConnection();
            if (conn == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"DB connection failed\"}");
                return;
            }
            try {
                int orderId;
                double amount;
                String currentStatus;
                String selectSql = "SELECT order_id, amount, status FROM payments WHERE payment_id = ? AND method = 'Cash'";
                try (PreparedStatement ps = conn.prepareStatement(selectSql)) {
                    ps.setInt(1, paymentId);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"status\":\"error\",\"message\":\"Cash payment request not found\"}");
                        return;
                    }
                    orderId = rs.getInt("order_id");
                    amount = rs.getDouble("amount");
                    currentStatus = rs.getString("status");
                }

                if (!"PENDING".equalsIgnoreCase(currentStatus)) {
                    response.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.print("{\"status\":\"error\",\"message\":\"Cash payment request already processed\"}");
                    return;
                }

                conn.setAutoCommit(false);
                String paymentStatus = paid ? "PAID" : "FAILED";
                try (PreparedStatement ps = conn.prepareStatement("UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ? AND status = 'PENDING'")) {
                    ps.setString(1, paymentStatus);
                    ps.setInt(2, paymentId);
                    ps.executeUpdate();
                }

                if (paid) {
                    createInvoice(conn, orderId, paymentId, amount);
                } else {
                    try (PreparedStatement ps = conn.prepareStatement("UPDATE orders SET status = 'Cancelled' WHERE order_id = ?")) {
                        ps.setInt(1, orderId);
                        ps.executeUpdate();
                    }
                }
                conn.commit();

                double[] invoice = calculateInvoiceBreakdown(amount);
                out.print("{\"status\":\"success\",\"paymentStatus\":\"" + paymentStatus + "\",\"orderId\":" + orderId
                    + ",\"subtotal\":" + invoice[0] + ",\"tax\":" + invoice[1] + ",\"serviceCharge\":" + invoice[2]
                    + ",\"discount\":" + invoice[3] + ",\"total\":" + invoice[4] + "}");
            } catch (SQLException e) {
                try { conn.rollback(); } catch (Exception ignore) {}
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"DB error processing cash payment\"}");
            } finally {
                try { conn.close(); } catch (Exception ignore) {}
            }
            return;
        }

        if ("callback".equalsIgnoreCase(action)) {
            // Simulated gateway callback: update payment and order payment status
            String paymentIdStr = request.getParameter("paymentId");
            String result = request.getParameter("result"); // success | failed
            String deliveryAddress = request.getParameter("deliveryAddress");
            
            if (paymentIdStr == null || result == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"paymentId and result required\"}");
                return;
            }

            int paymentId = Integer.parseInt(paymentIdStr);
            Connection conn = DBConnection.getConnection();
            if (conn == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"DB connection failed. Check DB_URL/credentials and that MySQL is running.\"}");
                return;
            }
            try {
                String sel = "SELECT order_id, amount FROM payments WHERE payment_id = ?";
                int orderId = -1;
                double amount = 0.0;
                try (PreparedStatement ps = conn.prepareStatement(sel)) {
                    ps.setInt(1, paymentId);
                    ResultSet rs = ps.executeQuery();
                    if (rs.next()) {
                        orderId = rs.getInt("order_id");
                        amount = rs.getDouble("amount");
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"status\":\"error\",\"message\":\"payment not found\"}");
                        return;
                    }
                }

                String newStatus = "FAILED";
                if ("success".equalsIgnoreCase(result)) newStatus = "PAID";

                String upd = "UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?";
                try (PreparedStatement ps2 = conn.prepareStatement(upd)) {
                    ps2.setString(1, newStatus);
                    ps2.setInt(2, paymentId);
                    ps2.executeUpdate();
                }

                // Update order payment status in orders table (if exists)
                try {
                    String orderUpd = "UPDATE orders SET payment_status = ?";
                    if (deliveryAddress != null && !deliveryAddress.trim().isEmpty()) {
                        orderUpd += ", delivery_address = ?";
                    }
                    orderUpd += " WHERE order_id = ?";
                    
                    try (PreparedStatement ps3 = conn.prepareStatement(orderUpd)) {
                        int paramIndex = 1;
                        ps3.setString(paramIndex++, newStatus);
                        if (deliveryAddress != null && !deliveryAddress.trim().isEmpty()) {
                            ps3.setString(paramIndex++, deliveryAddress.trim());
                        }
                        ps3.setInt(paramIndex, orderId);
                        ps3.executeUpdate();
                    }
                } catch (SQLException ex) {
                    // ignore if orders table differs; still continue
                }

                // Create invoice record if paid
                double[] invoice = null;
                if ("PAID".equalsIgnoreCase(newStatus)) {
                    invoice = calculateInvoiceBreakdown(amount);
                    createInvoice(conn, orderId, paymentId, amount);
                }

                if (invoice != null) {
                    out.print("{\"status\":\"success\",\"paymentStatus\":\"" + newStatus + "\",\"subtotal\":" + invoice[0] + ",\"tax\":" + invoice[1] + ",\"serviceCharge\":" + invoice[2] + ",\"discount\":" + invoice[3] + ",\"total\":" + invoice[4] + "}");
                } else {
                    out.print("{\"status\":\"success\",\"paymentStatus\":\"" + newStatus + "\"}");
                }
                return;
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"DB error on callback: " + escapeJson(e.getMessage()) + "\"}");
                return;
            } finally {
                try { conn.close(); } catch (Exception ignore) {}
            }
        }

        if ("refund".equalsIgnoreCase(action)) {
            String paymentIdStr = request.getParameter("paymentId");
            String amountStr = request.getParameter("amount");
            String reason = request.getParameter("reason") == null ? "" : request.getParameter("reason");
            if (paymentIdStr == null || amountStr == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"paymentId and amount required for refund\"}");
                return;
            }

            int paymentId = Integer.parseInt(paymentIdStr);
            double amount = Double.parseDouble(amountStr);

            Connection conn = DBConnection.getConnection();
            if (conn == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"DB connection failed. Check DB_URL/credentials and that MySQL is running.\"}");
                return;
            }
            try {
                // find order id
                int orderId = -1;
                try (PreparedStatement ps = conn.prepareStatement("SELECT order_id FROM payments WHERE payment_id = ?")) {
                    ps.setInt(1, paymentId);
                    ResultSet rs = ps.executeQuery();
                    if (rs.next()) orderId = rs.getInt("order_id");
                }

                String ins = "INSERT INTO refunds (payment_id, order_id, amount, reason, status) VALUES (?, ?, ?, ?, 'COMPLETED')";
                try (PreparedStatement ps2 = conn.prepareStatement(ins, PreparedStatement.RETURN_GENERATED_KEYS)) {
                    ps2.setInt(1, paymentId);
                    ps2.setInt(2, orderId);
                    ps2.setDouble(3, amount);
                    ps2.setString(4, reason);
                    ps2.executeUpdate();
                    ResultSet keys = ps2.getGeneratedKeys();
                    if (keys.next()) {
                        int refundId = keys.getInt(1);
                        // update payment status to REFUNDED or PARTIALLY_REFUNDED
                        try (PreparedStatement ps3 = conn.prepareStatement("UPDATE payments SET status = 'REFUNDED' WHERE payment_id = ?")) {
                            ps3.setInt(1, paymentId);
                            ps3.executeUpdate();
                        }
                        out.print("{\"status\":\"success\",\"refundId\":" + refundId + "}");
                        return;
                    }
                }
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"DB error creating refund: " + escapeJson(e.getMessage()) + "\"}");
                return;
            } finally {
                try { conn.close(); } catch (Exception ignore) {}
            }
        }

        out.print("{\"status\":\"error\",\"message\":\"Unknown or missing action\"}");
    }

    private void listPayments(PrintWriter out) {
        Connection conn = DBConnection.getConnection();
        if (conn == null) {
            out.print("[]");
            return;
        }
        try {
            String sql = "SELECT p.payment_id, p.order_id, u.name AS user_name, p.method, p.amount, p.status, p.gateway_reference, p.created_at "
                + "FROM payments p JOIN orders o ON p.order_id = o.order_id JOIN users u ON o.user_id = u.user_id "
                + "ORDER BY p.payment_id DESC LIMIT 200";
            try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                StringBuilder json = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    json.append("{")
                        .append("\"paymentId\":").append(rs.getInt("payment_id")).append(",")
                        .append("\"orderId\":").append(rs.getInt("order_id")).append(",")
                        .append("\"userName\":\"").append(escapeJson(rs.getString("user_name"))).append("\",")
                        .append("\"method\":\"").append(escapeJson(rs.getString("method"))).append("\",")
                        .append("\"amount\":").append(rs.getDouble("amount")).append(",")
                        .append("\"status\":\"").append(escapeJson(rs.getString("status"))).append("\",")
                        .append("\"gatewayRef\":\"").append(escapeJson(rs.getString("gateway_reference"))).append("\"")
                        .append("}");
                    first = false;
                }
                json.append("]");
                out.print(json.toString());
                return;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("[]");
        } finally {
            try { conn.close(); } catch (Exception ignore) {}
        }
    }

    private void listCashRequests(PrintWriter out) {
        Connection conn = DBConnection.getConnection();
        if (conn == null) {
            out.print("[]");
            return;
        }
        String sql = "SELECT p.payment_id, p.order_id, u.name AS user_name, p.amount, "
            + "GROUP_CONCAT(CONCAT(d.name, ' x ', oi.quantity) SEPARATOR ', ') AS items "
            + "FROM payments p JOIN orders o ON p.order_id = o.order_id JOIN users u ON o.user_id = u.user_id "
            + "LEFT JOIN order_items oi ON o.order_id = oi.order_id LEFT JOIN dishes d ON oi.dish_id = d.dish_id "
            + "WHERE p.method = 'Cash' AND p.status = 'PENDING' GROUP BY p.payment_id ORDER BY p.created_at ASC";
        try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            StringBuilder json = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) json.append(",");
                json.append("{\"paymentId\":").append(rs.getInt("payment_id"))
                    .append(",\"orderId\":").append(rs.getInt("order_id"))
                    .append(",\"userName\":\"").append(escapeJson(rs.getString("user_name")))
                    .append("\",\"items\":\"").append(escapeJson(rs.getString("items")))
                    .append("\",\"total\":").append(rs.getDouble("amount")).append("}");
                first = false;
            }
            json.append("]");
            out.print(json.toString());
        } catch (SQLException e) {
            out.print("[]");
        } finally {
            try { conn.close(); } catch (Exception ignore) {}
        }
    }

    private void sendPaymentStatus(PrintWriter out, int paymentId) {
        Connection conn = DBConnection.getConnection();
        if (conn == null) {
            out.print("{\"status\":\"error\",\"message\":\"DB connection failed\"}");
            return;
        }
        try (PreparedStatement ps = conn.prepareStatement("SELECT payment_id, order_id, amount, status FROM payments WHERE payment_id = ? AND method = 'Cash'")) {
            ps.setInt(1, paymentId);
            ResultSet rs = ps.executeQuery();
            if (!rs.next()) {
                out.print("{\"status\":\"error\",\"message\":\"Payment not found\"}");
                return;
            }
            String paymentStatus = rs.getString("status");
            double[] invoice = calculateInvoiceBreakdown(rs.getDouble("amount"));
            out.print("{\"status\":\"success\",\"paymentStatus\":\"" + escapeJson(paymentStatus) + "\",\"orderId\":"
                + rs.getInt("order_id") + ",\"subtotal\":" + invoice[0] + ",\"tax\":" + invoice[1]
                + ",\"serviceCharge\":" + invoice[2] + ",\"discount\":" + invoice[3] + ",\"total\":" + invoice[4] + "}");
        } catch (SQLException e) {
            out.print("{\"status\":\"error\",\"message\":\"DB error reading payment status\"}");
        } finally {
            try { conn.close(); } catch (Exception ignore) {}
        }
    }

    private void sendInvoice(PrintWriter out, int orderId) {
        Connection conn = DBConnection.getConnection();
        if (conn == null) {
            out.print("{\"status\":\"error\",\"message\":\"DB connection failed.\"}");
            return;
        }
        try {
            String sql = "SELECT invoice_id, invoice_number, subtotal, tax, service_charge, discount, total, created_at FROM invoices WHERE order_id = ? ORDER BY invoice_id DESC LIMIT 1";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, orderId);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    StringBuilder j = new StringBuilder("{");
                    j.append("\"invoiceId\":").append(rs.getInt("invoice_id")).append(",");
                    j.append("\"invoiceNumber\":\"").append(escapeJson(rs.getString("invoice_number"))).append("\",");
                    j.append("\"subtotal\":").append(rs.getDouble("subtotal")).append(",");
                    j.append("\"tax\":").append(rs.getDouble("tax")).append(",");
                    j.append("\"serviceCharge\":").append(rs.getDouble("service_charge")).append(",");
                    j.append("\"discount\":").append(rs.getDouble("discount")).append(",");
                    j.append("\"total\":").append(rs.getDouble("total")).append(",");
                    j.append("\"createdAt\":\"").append(rs.getTimestamp("created_at").toString()).append("\"");
                    j.append("}");
                    out.print(j.toString());
                    return;
                } else {
                    out.print("{\"status\":\"error\",\"message\":\"Invoice not found\"}");
                    return;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"status\":\"error\",\"message\":\"DB error: " + escapeJson(e.getMessage()) + "\"}");
            return;
        } finally {
            try { conn.close(); } catch (Exception ignore) {}
        }
    }

    private void createInvoice(Connection conn, int orderId, int paymentId, double amount) throws SQLException {
        double[] invoice = calculateInvoiceBreakdown(amount);
        double subtotal = invoice[0];
        double tax = invoice[1];
        double service = invoice[2];
        double discount = invoice[3];
        double total = invoice[4];

        String invNum = "INV-" + System.currentTimeMillis();
        String ins = "INSERT INTO invoices (order_id, payment_id, invoice_number, subtotal, tax, service_charge, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(ins)) {
            ps.setInt(1, orderId);
            ps.setInt(2, paymentId);
            ps.setString(3, invNum);
            ps.setDouble(4, round(subtotal));
            ps.setDouble(5, round(tax));
            ps.setDouble(6, round(service));
            ps.setDouble(7, round(discount));
            ps.setDouble(8, round(total));
            ps.executeUpdate();
        }
    }

    private double[] calculateInvoiceBreakdown(double amount) {
        double taxRate = 0.05;
        double serviceRate = 0.02;
        double subtotal = round(amount / (1 + taxRate + serviceRate));
        double tax = round(subtotal * taxRate);
        double service = round(subtotal * serviceRate);
        double discount = 0.0;
        double total = round(subtotal + tax + service - discount);
        return new double[] { subtotal, tax, service, discount, total };
    }

    private double round(double v) {
        DecimalFormat df = new DecimalFormat("#.##");
        try {
            return Double.parseDouble(df.format(v));
        } catch (Exception e) { return v; }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}

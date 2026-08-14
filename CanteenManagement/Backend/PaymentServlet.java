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
                String insertSql = "INSERT INTO payments (order_id, method, amount, currency, status, gateway_reference) VALUES (?, ?, ?, ?, 'PENDING', ?)";
                String gatewayRef = "DUMMY-" + UUID.randomUUID().toString();
                try (PreparedStatement ps = conn.prepareStatement(insertSql, PreparedStatement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, Integer.parseInt(orderIdStr));
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

        if ("callback".equalsIgnoreCase(action)) {
            // Simulated gateway callback: update payment and order payment status
            String paymentIdStr = request.getParameter("paymentId");
            String result = request.getParameter("result"); // success | failed
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
                    String orderUpd = "UPDATE orders SET payment_status = ? WHERE order_id = ?";
                    try (PreparedStatement ps3 = conn.prepareStatement(orderUpd)) {
                        ps3.setString(1, newStatus);
                        ps3.setInt(2, orderId);
                        ps3.executeUpdate();
                    }
                } catch (SQLException ex) {
                    // ignore if orders table differs; still continue
                }

                // Create invoice record if paid
                if ("PAID".equalsIgnoreCase(newStatus)) {
                    createInvoice(conn, orderId, paymentId, amount);
                }

                out.print("{\"status\":\"success\",\"paymentStatus\":\"" + newStatus + "\"}");
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
            String sql = "SELECT payment_id, order_id, method, amount, status, gateway_reference, created_at FROM payments ORDER BY payment_id DESC LIMIT 200";
            try (PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
                StringBuilder json = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    json.append("{")
                        .append("\"paymentId\":").append(rs.getInt("payment_id")).append(",")
                        .append("\"orderId\":").append(rs.getInt("order_id")).append(",")
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
        // Very simple invoice calculation: assume fixed tax 5% and service 2%
        double subtotal = amount / 1.07; // approximate
        double tax = subtotal * 0.05;
        double service = subtotal * 0.02;
        double discount = 0.0;
        double total = amount;

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

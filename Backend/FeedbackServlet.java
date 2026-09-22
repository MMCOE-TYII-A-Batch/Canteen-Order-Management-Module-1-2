/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - FEEDBACK SERVLET (FeedbackServlet.java)
   --------------------------------------------------------------------------
   PART 3+ INTEGRATION: Item-Level Feedback & Reviews Management
   Customers submit ratings and reviews per dish; visible to all users; manager sees summary
   ========================================================================== */

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/feedback")
public class FeedbackServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String dishIdParam = request.getParameter("dishId");

        try (Connection conn = DBConnection.getConnection()) {
            if (conn == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Database connection failed.\"}");
                return;
            }

            if (dishIdParam != null && !dishIdParam.isEmpty()) {
                // Fetch feedback for a specific dish
                int dishId = Integer.parseInt(dishIdParam);
                String sql = "SELECT uf.feedback_id, uf.user_id, uf.dish_id, uf.rating, uf.comments, uf.created_at, u.name " +
                             "FROM user_feedback uf " +
                             "JOIN users u ON uf.user_id = u.user_id " +
                             "WHERE uf.dish_id = ? " +
                             "ORDER BY uf.created_at DESC " +
                             "LIMIT 50";

                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, dishId);
                    ResultSet rs = ps.executeQuery();
                    StringBuilder json = new StringBuilder("[");
                    boolean first = true;

                    while (rs.next()) {
                        if (!first) json.append(",");
                        String createdAt = rs.getTimestamp("created_at") != null 
                            ? rs.getTimestamp("created_at").toString() 
                            : LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

                        json.append("{")
                            .append("\"feedbackId\":").append(rs.getInt("feedback_id")).append(",")
                            .append("\"userId\":").append(rs.getInt("user_id")).append(",")
                            .append("\"dishId\":").append(rs.getInt("dish_id")).append(",")
                            .append("\"rating\":").append(rs.getInt("rating")).append(",")
                            .append("\"comments\":\"").append(escapeJson(rs.getString("comments"))).append("\",")
                            .append("\"userName\":\"").append(escapeJson(rs.getString("name"))).append("\",")
                            .append("\"createdAt\":\"").append(createdAt).append("\"")
                            .append("}");
                        first = false;
                    }

                    json.append("]");
                    out.print(json.toString());
                }
            } else {
                // Fetch all feedback for manager summary
                String sql = "SELECT uf.feedback_id, uf.user_id, uf.dish_id, uf.rating, uf.comments, uf.created_at, u.name, d.name AS dish_name " +
                             "FROM user_feedback uf " +
                             "JOIN users u ON uf.user_id = u.user_id " +
                             "JOIN dishes d ON uf.dish_id = d.dish_id " +
                             "ORDER BY uf.created_at DESC " +
                             "LIMIT 100";

                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ResultSet rs = ps.executeQuery();
                    StringBuilder json = new StringBuilder("[");
                    boolean first = true;

                    while (rs.next()) {
                        if (!first) json.append(",");
                        String createdAt = rs.getTimestamp("created_at") != null 
                            ? rs.getTimestamp("created_at").toString() 
                            : LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

                        json.append("{")
                            .append("\"feedbackId\":").append(rs.getInt("feedback_id")).append(",")
                            .append("\"userId\":").append(rs.getInt("user_id")).append(",")
                            .append("\"dishId\":").append(rs.getInt("dish_id")).append(",")
                            .append("\"rating\":").append(rs.getInt("rating")).append(",")
                            .append("\"comments\":\"").append(escapeJson(rs.getString("comments"))).append("\",")
                            .append("\"userName\":\"").append(escapeJson(rs.getString("name"))).append("\",")
                            .append("\"dishName\":\"").append(escapeJson(rs.getString("dish_name"))).append("\",")
                            .append("\"createdAt\":\"").append(createdAt).append("\"")
                            .append("}");
                        first = false;
                    }

                    json.append("]");
                    out.print(json.toString());
                }
            }

        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Invalid dish ID format.\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\",\"message\":\"Database error fetching feedback.\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        
        if ("addFeedback".equalsIgnoreCase(action)) {
            try {
                int userId = Integer.parseInt(request.getParameter("userId"));
                int dishId = Integer.parseInt(request.getParameter("dishId"));
                int rating = Integer.parseInt(request.getParameter("rating"));
                String comments = request.getParameter("comments");

                if (rating < 1 || rating > 5) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"status\":\"error\",\"message\":\"Rating must be between 1 and 5.\"}");
                    return;
                }

                try (Connection conn = DBConnection.getConnection()) {
                    if (conn == null) {
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        out.print("{\"status\":\"error\",\"message\":\"Database connection failed.\"}");
                        return;
                    }

                    // Check if user already gave feedback for this dish (replace existing)
                    String deletePrior = "DELETE FROM user_feedback WHERE user_id = ? AND dish_id = ?";
                    try (PreparedStatement psDelete = conn.prepareStatement(deletePrior)) {
                        psDelete.setInt(1, userId);
                        psDelete.setInt(2, dishId);
                        psDelete.executeUpdate();
                    }

                    // Insert new feedback
                    String sql = "INSERT INTO user_feedback (user_id, dish_id, rating, comments) VALUES (?, ?, ?, ?)";
                    try (PreparedStatement ps = conn.prepareStatement(sql)) {
                        ps.setInt(1, userId);
                        ps.setInt(2, dishId);
                        ps.setInt(3, rating);
                        ps.setString(4, comments != null ? comments : "");
                        ps.executeUpdate();
                        out.print("{\"status\":\"success\",\"message\":\"Feedback submitted successfully.\"}");
                    }
                }
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"Invalid input parameters.\"}");
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Failed to save feedback.\"}");
            }
            return;
        }

        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        out.print("{\"status\":\"error\",\"message\":\"Unknown action.\"}");
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "")
                    .replace("\t", "\\t");
    }
}

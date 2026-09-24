/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - EXPANDED DISH SERVLET (DishServlet.java)
   --------------------------------------------------------------------------
   PART 2 INTEGRATION: Menu & Dish Management, Stock Linkage, Search & Filters
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

@WebServlet("/dish")
public class DishServlet extends HttpServlet {

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

        String categoryParam = request.getParameter("category");
        String searchParam = request.getParameter("search");
        String sortBy = request.getParameter("sortBy"); // priceAsc, priceDesc, popularity

        StringBuilder sql = new StringBuilder(
            "SELECT d.dish_id, d.name, c.category_name, d.price, d.tax_rate, d.description, d.ingredients, " +
            "d.allergens, d.nutrition, d.prep_time, d.serving_window, d.stock_quantity, d.is_available, " +
            "d.is_offer, d.is_combo, d.is_recommended, d.discount_percent, d.image_url " +
            "FROM dishes d JOIN categories c ON d.category_id = c.category_id WHERE 1=1 "
        );

        if (categoryParam != null && !categoryParam.isEmpty() && !"All".equalsIgnoreCase(categoryParam)) {
            sql.append("AND c.category_name = ? ");
        }

        if (searchParam != null && !searchParam.trim().isEmpty()) {
            sql.append("AND (LOWER(d.name) LIKE ? OR LOWER(d.description) LIKE ? OR LOWER(d.ingredients) LIKE ?) ");
        }

        if ("priceAsc".equalsIgnoreCase(sortBy)) {
            sql.append("ORDER BY d.price ASC");
        } else if ("priceDesc".equalsIgnoreCase(sortBy)) {
            sql.append("ORDER BY d.price DESC");
        } else if ("popularity".equalsIgnoreCase(sortBy)) {
            sql.append("ORDER BY d.is_recommended DESC, d.is_offer DESC, d.dish_id ASC");
        } else {
            sql.append("ORDER BY d.dish_id ASC");
        }

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {

            int paramIndex = 1;
            if (categoryParam != null && !categoryParam.isEmpty() && !"All".equalsIgnoreCase(categoryParam)) {
                ps.setString(paramIndex++, categoryParam);
            }

            if (searchParam != null && !searchParam.trim().isEmpty()) {
                String searchPattern = "%" + searchParam.trim().toLowerCase() + "%";
                ps.setString(paramIndex++, searchPattern);
                ps.setString(paramIndex++, searchPattern);
                ps.setString(paramIndex++, searchPattern);
            }

            ResultSet rs = ps.executeQuery();
            StringBuilder json = new StringBuilder("[");
            boolean first = true;

            while (rs.next()) {
                if (!first) json.append(",");

                int stock = rs.getInt("stock_quantity");
                boolean available = rs.getBoolean("is_available") && (stock > 0);

                json.append("{")
                    .append("\"id\":").append(rs.getInt("dish_id")).append(",")
                    .append("\"name\":\"").append(escapeJson(rs.getString("name"))).append("\",")
                    .append("\"category\":\"").append(escapeJson(rs.getString("category_name"))).append("\",")
                    .append("\"price\":").append(rs.getDouble("price")).append(",")
                    .append("\"taxRate\":").append(rs.getDouble("tax_rate")).append(",")
                    .append("\"description\":\"").append(escapeJson(rs.getString("description"))).append("\",")
                    .append("\"ingredients\":\"").append(escapeJson(rs.getString("ingredients"))).append("\",")
                    .append("\"allergens\":\"").append(escapeJson(rs.getString("allergens"))).append("\",")
                    .append("\"nutrition\":\"").append(escapeJson(rs.getString("nutrition"))).append("\",")
                    .append("\"prepTime\":\"").append(escapeJson(rs.getString("prep_time"))).append("\",")
                    .append("\"servingWindow\":\"").append(escapeJson(rs.getString("serving_window"))).append("\",")
                    .append("\"stockQuantity\":").append(stock).append(",")
                    .append("\"isAvailable\":").append(available).append(",")
                    .append("\"isOffer\":").append(rs.getBoolean("is_offer")).append(",")
                    .append("\"isCombo\":").append(rs.getBoolean("is_combo")).append(",")
                    .append("\"isRecommended\":").append(rs.getBoolean("is_recommended")).append(",")
                    .append("\"discountPercent\":").append(rs.getDouble("discount_percent")).append(",")
                    .append("\"image\":\"").append(escapeJson(rs.getString("image_url"))).append("\"")
                    .append("}");
                first = false;
            }

            json.append("]");
            out.print(json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\",\"message\":\"Database error fetching dishes.\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        setCorsHeaders(response);
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        
        if ("toggleAvailability".equalsIgnoreCase(action)) {
            int dishId = Integer.parseInt(request.getParameter("dishId"));
            boolean available = Boolean.parseBoolean(request.getParameter("available"));
            
            String updateSql = "UPDATE dishes SET is_available = ? WHERE dish_id = ?";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setBoolean(1, available);
                ps.setInt(2, dishId);
                ps.executeUpdate();
                out.print("{\"status\":\"success\",\"message\":\"Availability updated.\"}");
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Failed to update dish status.\"}");
            }
            return;
        }

        if ("deleteDish".equalsIgnoreCase(action)) {
            int dishId = Integer.parseInt(request.getParameter("dishId"));
            String deleteSql = "DELETE FROM dishes WHERE dish_id = ?";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(deleteSql)) {
                ps.setInt(1, dishId);
                ps.executeUpdate();
                out.print("{\"status\":\"success\",\"message\":\"Dish deleted from catalogue.\"}");
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Failed to delete dish.\"}");
            }
            return;
        }

        if ("updateDish".equalsIgnoreCase(action)) {
            int dishId = Integer.parseInt(request.getParameter("dishId"));
            String name = request.getParameter("name");
            String categoryName = request.getParameter("category");
            String priceStr = request.getParameter("price");
            String description = request.getParameter("description");
            String ingredients = request.getParameter("ingredients");
            String allergens = request.getParameter("allergens");
            String nutrition = request.getParameter("nutrition");
            String prepTime = request.getParameter("prepTime");
            String servingWindow = request.getParameter("servingWindow");
            String stockStr = request.getParameter("stockQuantity");
            String imageUrl = request.getParameter("imageUrl");

            if (name == null || priceStr == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\",\"message\":\"Dish name and price are required for update.\"}");
                return;
            }

            int categoryId = 3; // Default Snacks
            String catSql = "SELECT category_id FROM categories WHERE category_name = ?";
            String updateSql = "UPDATE dishes SET name = ?, category_id = ?, price = ?, description = ?, ingredients = ?, allergens = ?, nutrition = ?, prep_time = ?, serving_window = ?, stock_quantity = ?, image_url = ? WHERE dish_id = ?";

            try (Connection conn = DBConnection.getConnection()) {
                try (PreparedStatement psCat = conn.prepareStatement(catSql)) {
                    psCat.setString(1, categoryName != null ? categoryName : "Snacks");
                    ResultSet rs = psCat.executeQuery();
                    if (rs.next()) categoryId = rs.getInt("category_id");
                }

                try (PreparedStatement psUpdate = conn.prepareStatement(updateSql)) {
                    psUpdate.setString(1, name);
                    psUpdate.setInt(2, categoryId);
                    psUpdate.setDouble(3, Double.parseDouble(priceStr));
                    psUpdate.setString(4, description != null ? description : "");
                    psUpdate.setString(5, ingredients != null ? ingredients : "Standard Ingredients");
                    psUpdate.setString(6, allergens != null ? allergens : "None");
                    psUpdate.setString(7, nutrition != null ? nutrition : "N/A");
                    psUpdate.setString(8, prepTime != null ? prepTime : "10 mins");
                    psUpdate.setString(9, servingWindow != null ? servingWindow : "All Day");
                    psUpdate.setInt(10, stockStr != null ? Integer.parseInt(stockStr) : 50);
                    psUpdate.setString(11, imageUrl != null ? imageUrl : "");
                    psUpdate.setInt(12, dishId);
                    int updated = psUpdate.executeUpdate();
                    if (updated > 0) {
                        out.print("{\"status\":\"success\",\"message\":\"Dish updated successfully.\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.print("{\"status\":\"error\",\"message\":\"Dish not found for update.\"}");
                    }
                }
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\",\"message\":\"Failed to update dish.\"}");
            }
            return;
        }

        // Add new dish
        String name = request.getParameter("name");
        String categoryName = request.getParameter("category");
        String priceStr = request.getParameter("price");
        String description = request.getParameter("description");
        String ingredients = request.getParameter("ingredients");
        String allergens = request.getParameter("allergens");
        String nutrition = request.getParameter("nutrition");
        String prepTime = request.getParameter("prepTime");
        String servingWindow = request.getParameter("servingWindow");
        String stockStr = request.getParameter("stockQuantity");
        String imageUrl = request.getParameter("imageUrl");

        if (name == null || priceStr == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\",\"message\":\"Dish name and price are required.\"}");
            return;
        }

        int categoryId = 3; // Default Snacks
        String catSql = "SELECT category_id FROM categories WHERE category_name = ?";
        String insertSql = "INSERT INTO dishes (name, category_id, price, description, ingredients, allergens, nutrition, prep_time, serving_window, stock_quantity, is_available, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            try (PreparedStatement psCat = conn.prepareStatement(catSql)) {
                psCat.setString(1, categoryName != null ? categoryName : "Snacks");
                ResultSet rs = psCat.executeQuery();
                if (rs.next()) categoryId = rs.getInt("category_id");
            }

            try (PreparedStatement psIns = conn.prepareStatement(insertSql)) {
                psIns.setString(1, name);
                psIns.setInt(2, categoryId);
                psIns.setDouble(3, Double.parseDouble(priceStr));
                psIns.setString(4, description != null ? description : "");
                psIns.setString(5, ingredients != null ? ingredients : "Standard Ingredients");
                psIns.setString(6, allergens != null ? allergens : "None");
                psIns.setString(7, nutrition != null ? nutrition : "N/A");
                psIns.setString(8, prepTime != null ? prepTime : "10 mins");
                psIns.setString(9, servingWindow != null ? servingWindow : "All Day");
                psIns.setInt(10, stockStr != null ? Integer.parseInt(stockStr) : 50);
                psIns.setString(11, imageUrl != null ? imageUrl : "");
                psIns.executeUpdate();
                out.print("{\"status\":\"success\",\"message\":\"New dish added to menu!\"}");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\",\"message\":\"Failed to add dish.\"}");
        }
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}

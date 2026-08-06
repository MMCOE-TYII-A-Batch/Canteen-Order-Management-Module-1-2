/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - USER SERVLET (UserServlet.java)
   --------------------------------------------------------------------------
   Educational Java Servlet handling user query & management requests.
   Annotated with @WebServlet("/user") for automatic Tomcat 10 discovery.
   ========================================================================== */

import java.io.IOException;
import java.io.PrintWriter;
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
        
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String userIdStr = request.getParameter("id");

        out.println("<!DOCTYPE html>");
        out.println("<html>");
        out.println("<head><title>User Query Result</title></head>");
        out.println("<body style='font-family: Arial, sans-serif; padding: 40px; background-color: #FFF8E7;'>");
        out.println("<h1 style='color: #FFC107; background: #222; padding: 15px; border-radius: 8px;'>Campus Canteen Backend Servlet</h1>");
        out.println("<h2>User Found</h2>");
        out.println("<p><strong>Requested User ID:</strong> " + (userIdStr != null ? userIdStr : "Default #1") + "</p>");
        out.println("<p><strong>Sample Name:</strong> Rahul Sharma</p>");
        out.println("<p><strong>Role:</strong> Student</p>");
        out.println("<p><strong>Status:</strong> Active</p>");
        out.println("<p style='color: green;'>Independent Servlet Test: User record retrieved successfully!</p>");
        out.println("<a href='../../frontend/manage-users.html' style='display:inline-block; padding: 10px 20px; background: #222; color: #fff; text-decoration: none; border-radius: 5px;'>Back to User Management</a>");
        out.println("</body>");
        out.println("</html>");
    }
}

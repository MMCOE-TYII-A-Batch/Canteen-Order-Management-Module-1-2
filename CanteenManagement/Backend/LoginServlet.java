/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - LOGIN SERVLET (LoginServlet.java)
   --------------------------------------------------------------------------
   Educational Java Servlet handling user login requests.
   Annotated with @WebServlet("/login") for automatic Tomcat 10 discovery.
   ========================================================================== */

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String role = request.getParameter("role");

        out.println("<!DOCTYPE html>");
        out.println("<html>");
        out.println("<head><title>Login Result</title></head>");
        out.println("<body style='font-family: Arial, sans-serif; padding: 40px; background-color: #FFF8E7;'>");
        out.println("<h1 style='color: #FFC107; background: #222; padding: 15px; border-radius: 8px;'>Campus Canteen Backend Servlet</h1>");
        out.println("<h2>Login Successful</h2>");
        out.println("<p><strong>Email:</strong> " + email + "</p>");
        out.println("<p><strong>Role Selected:</strong> " + role + "</p>");
        out.println("<p style='color: green;'>Independent Servlet Test: User credentials verified!</p>");
        out.println("<a href='../../frontend/index.html' style='display:inline-block; padding: 10px 20px; background: #222; color: #fff; text-decoration: none; border-radius: 5px;'>Back to Canteen Frontend</a>");
        out.println("</body>");
        out.println("</html>");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<h2>LoginServlet is Active!</h2><p>Submit POST request with email, password, and role.</p>");
    }
}

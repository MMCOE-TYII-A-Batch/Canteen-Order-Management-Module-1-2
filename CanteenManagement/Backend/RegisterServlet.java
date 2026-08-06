/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - REGISTER SERVLET (RegisterServlet.java)
   --------------------------------------------------------------------------
   Educational Java Servlet handling user registration requests.
   Annotated with @WebServlet("/register") for automatic Tomcat 10 discovery.
   ========================================================================== */

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String phone = request.getParameter("phone");
        String idNumber = request.getParameter("idNumber");
        String department = request.getParameter("department");
        String role = request.getParameter("role");

        out.println("<!DOCTYPE html>");
        out.println("<html>");
        out.println("<head><title>Registration Result</title></head>");
        out.println("<body style='font-family: Arial, sans-serif; padding: 40px; background-color: #FFF8E7;'>");
        out.println("<h1 style='color: #FFC107; background: #222; padding: 15px; border-radius: 8px;'>Campus Canteen Backend Servlet</h1>");
        out.println("<h2>Registration Successful</h2>");
        out.println("<p><strong>Full Name:</strong> " + name + "</p>");
        out.println("<p><strong>Email:</strong> " + email + "</p>");
        out.println("<p><strong>Student/Employee ID:</strong> " + idNumber + "</p>");
        out.println("<p><strong>Department:</strong> " + department + "</p>");
        out.println("<p><strong>Assigned Role:</strong> " + role + "</p>");
        out.println("<p style='color: green;'>Independent Servlet Test: Account registered in system!</p>");
        out.println("<a href='../../frontend/login.html' style='display:inline-block; padding: 10px 20px; background: #222; color: #fff; text-decoration: none; border-radius: 5px;'>Proceed to Login</a>");
        out.println("</body>");
        out.println("</html>");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<h2>RegisterServlet is Active!</h2><p>Submit POST request to register user.</p>");
    }
}

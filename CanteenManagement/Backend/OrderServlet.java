/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - ORDER SERVLET (OrderServlet.java)
   --------------------------------------------------------------------------
   Educational Java Servlet handling food order placements & updates.
   Annotated with @WebServlet("/order") for automatic Tomcat 10 discovery.
   ========================================================================== */

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/order")
public class OrderServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String items = request.getParameter("items");
        String total = request.getParameter("total");
        String studentName = request.getParameter("studentName");

        out.println("<!DOCTYPE html>");
        out.println("<html>");
        out.println("<head><title>Order Processing Result</title></head>");
        out.println("<body style='font-family: Arial, sans-serif; padding: 40px; background-color: #FFF8E7;'>");
        out.println("<h1 style='color: #FFC107; background: #222; padding: 15px; border-radius: 8px;'>Campus Canteen Backend Servlet</h1>");
        out.println("<h2>Order Received</h2>");
        out.println("<p><strong>Student Name:</strong> " + (studentName != null ? studentName : "Rahul Sharma") + "</p>");
        out.println("<p><strong>Ordered Items:</strong> " + (items != null ? items : "Masala Dosa x 2") + "</p>");
        out.println("<p><strong>Total Amount:</strong> ₹" + (total != null ? total : "120") + "</p>");
        out.println("<p><strong>Status:</strong> New -> Sent to Kitchen Queue</p>");
        out.println("<p style='color: green;'>Independent Servlet Test: Order created and placed!</p>");
        out.println("<a href='../../frontend/student-dashboard.html' style='display:inline-block; padding: 10px 20px; background: #222; color: #fff; text-decoration: none; border-radius: 5px;'>Back to Student Dashboard</a>");
        out.println("</body>");
        out.println("</html>");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println("<h2>OrderServlet is Active!</h2><p>Submit POST request to process an order.</p>");
    }
}

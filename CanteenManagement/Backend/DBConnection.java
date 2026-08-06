/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - JDBC CONNECTION HELPER (DBConnection.java)
   --------------------------------------------------------------------------
   Educational Java Utility for connecting Java Servlets to MySQL Database.
   Database Name: canteen_management
   Driver: com.mysql.cj.jdbc.Driver
   ========================================================================== */

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {

    // Database Connection Parameters
    private static final String URL = "jdbc:mysql://localhost:3306/canteen_management?useSSL=false&allowPublicKeyRetrieval=true";
    private static final String USER = "root";
    private static final String PASSWORD = "root"; // Update with local MySQL password

    /**
     * Establishes and returns a new JDBC Database Connection
     * @return Connection object if successful, null otherwise
     */
    public static Connection getConnection() {
        Connection conn = null;
        try {
            // Step 1: Load MySQL JDBC Driver Class
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            // Step 2: Establish Connection using DriverManager
            conn = DriverManager.getConnection(URL, USER, PASSWORD);
            System.out.println("[DBConnection] MySQL Database Connected Successfully!");
        } catch (ClassNotFoundException e) {
            System.err.println("[DBConnection Error] MySQL JDBC Driver not found. Ensure mysql-connector-j.jar is in WEB-INF/lib");
            e.printStackTrace();
        } catch (SQLException e) {
            System.err.println("[DBConnection Error] Failed to connect to MySQL database.");
            e.printStackTrace();
        }
        return conn;
    }
}

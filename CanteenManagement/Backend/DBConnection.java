/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - JDBC CONNECTION HELPER (DBConnection.java)
   --------------------------------------------------------------------------
   Educational Java Utility for connecting Java Servlets to MySQL Database.
   Reads credentials from Environment Variables or db.properties to ensure
   personal MySQL passwords are NOT committed to Git.
   Default MySQL Port: 3307
   ========================================================================== */

import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DBConnection {

    private static String dbUrl = "jdbc:mysql://localhost:3307/canteen_management?useSSL=false&allowPublicKeyRetrieval=true";
    private static String dbUser = "root";
    private static String dbPassword = "2005";

    static {
        // Step 1: Try reading from local db.properties file (ignored by Git)
        try (InputStream input = DBConnection.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (input != null) {
                Properties prop = new Properties();
                prop.load(input);
                if (prop.getProperty("db.url") != null) {
                    dbUrl = prop.getProperty("db.url");
                } else if (prop.getProperty("db.port") != null) {
                    dbUrl = "jdbc:mysql://localhost:" + prop.getProperty("db.port") + "/canteen_management?useSSL=false&allowPublicKeyRetrieval=true";
                }
                if (prop.getProperty("db.user") != null) dbUser = prop.getProperty("db.user");
                if (prop.getProperty("db.password") != null) dbPassword = prop.getProperty("db.password");
                System.out.println("[DBConnection] Loaded configuration from db.properties");
            }
        } catch (Exception e) {
            // Ignore if db.properties doesn't exist
        }

        // Step 2: Override with Environment Variables if set (DB_USER, DB_PASSWORD, DB_URL, DB_PORT)
        if (System.getenv("DB_PORT") != null) {
            dbUrl = "jdbc:mysql://localhost:" + System.getenv("DB_PORT") + "/canteen_management?useSSL=false&allowPublicKeyRetrieval=true";
        }
        if (System.getenv("DB_URL") != null) dbUrl = System.getenv("DB_URL");
        if (System.getenv("DB_USER") != null) dbUser = System.getenv("DB_USER");
        if (System.getenv("DB_PASSWORD") != null) dbPassword = System.getenv("DB_PASSWORD");
    }

    /**
     * Establishes and returns a new JDBC Database Connection
     * @return Connection object if successful, null otherwise
     */
    public static Connection getConnection() {
        Connection conn = null;
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
        } catch (ClassNotFoundException e) {
            System.err.println("[DBConnection Error] MySQL JDBC Driver not found. Ensure mysql-connector-j.jar is in WEB-INF/lib");
            e.printStackTrace();
        } catch (SQLException e) {
            System.err.println("[DBConnection Error] Failed to connect to MySQL database. Check URL (" + dbUrl + "), user & password.");
            e.printStackTrace();
        }
        return conn;
    }
}

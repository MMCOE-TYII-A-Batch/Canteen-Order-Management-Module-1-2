/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - USER POJO (User.java)
   --------------------------------------------------------------------------
   Educational Java Model representing a User in the Canteen System.
   Role Options: Student, Manager, Staff
   No advanced frameworks - Plain Java with getters, setters & comments.
   ========================================================================== */

public class User {

    // ----------------------------------------------------------------------
    // 1. MEMBER VARIABLES (Attributes)
    // ----------------------------------------------------------------------
    private int userId;
    private String name;
    private String email;
    private String phone;
    private String role;        // Student, Manager, or Staff
    private String department;
    private String status;      // Active or Suspended

    // ----------------------------------------------------------------------
    // 2. CONSTRUCTORS
    // ----------------------------------------------------------------------
    
    // Default No-Arg Constructor
    public User() {
    }

    // Parameterized Constructor
    public User(int userId, String name, String email, String phone, String role, String department, String status) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.department = department;
        this.status = status;
    }

    // ----------------------------------------------------------------------
    // 3. GETTERS AND SETTERS
    // ----------------------------------------------------------------------

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // String Representation for Debugging
    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", department='" + department + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}

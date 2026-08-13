// added Order entity with getter and setter 
public class Order {

    // ----------------------------------------------------------------------
    // 1. MEMBER VARIABLES (Attributes)
    // ----------------------------------------------------------------------
    private int orderId;
    private String studentName;
    private String items;
    private double totalAmount;
    private String status;
    private String orderDate;
    private String deliveryAddress;

    // ----------------------------------------------------------------------
    // 2. CONSTRUCTORS
    // ----------------------------------------------------------------------

    // Default No-Arg Constructor
    public Order() {
    }

    // Parameterized Constructor (without delivery address for backward compatibility)
    public Order(int orderId, String studentName, String items, double totalAmount, String status, String orderDate) {
        this.orderId = orderId;
        this.studentName = studentName;
        this.items = items;
        this.totalAmount = totalAmount;
        this.status = status;
        this.orderDate = orderDate;
        this.deliveryAddress = "Main Canteen Counter";
    }

    // Parameterized Constructor (with delivery address)
    public Order(int orderId, String studentName, String items, double totalAmount, String status, String orderDate, String deliveryAddress) {
        this.orderId = orderId;
        this.studentName = studentName;
        this.items = items;
        this.totalAmount = totalAmount;
        this.status = status;
        this.orderDate = orderDate;
        this.deliveryAddress = deliveryAddress;
    }

    // ----------------------------------------------------------------------
    // 3. GETTERS AND SETTERS
    // ----------------------------------------------------------------------

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(String orderDate) {
        this.orderDate = orderDate;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    @Override
    public String toString() {
        return "Order{" +
                "orderId=" + orderId +
                ", studentName='" + studentName + '\'' +
                ", items='" + items + '\'' +
                ", totalAmount=" + totalAmount +
                ", status='" + status + '\'' +
                ", orderDate='" + orderDate + '\'' +
                ", deliveryAddress='" + deliveryAddress + '\'' +
                '}';
    }
}

/* ==========================================================================
   CAMPUS CANTEEN MANAGEMENT SYSTEM - DISH POJO (Dish.java)
   --------------------------------------------------------------------------
   Educational Java Model representing a Canteen Food Item (Dish).
   Categories: Breakfast, Meals, Snacks, Beverages
   No advanced frameworks - Plain Java with getters, setters & comments.
   ========================================================================== */

public class Dish {

    // ----------------------------------------------------------------------
    // 1. MEMBER VARIABLES (Attributes)
    // ----------------------------------------------------------------------
    private int dishId;
    private String name;
    private String category;
    private double price;
    private String description;
    private String prepTime;
    private boolean isAvailable;

    // ----------------------------------------------------------------------
    // 2. CONSTRUCTORS
    // ----------------------------------------------------------------------

    // Default No-Arg Constructor
    public Dish() {
    }

    // Parameterized Constructor
    public Dish(int dishId, String name, String category, double price, String description, String prepTime, boolean isAvailable) {
        this.dishId = dishId;
        this.name = name;
        this.category = category;
        this.price = price;
        this.description = description;
        this.prepTime = prepTime;
        this.isAvailable = isAvailable;
    }

    // ----------------------------------------------------------------------
    // 3. GETTERS AND SETTERS
    // ----------------------------------------------------------------------

    public int getDishId() {
        return dishId;
    }

    public void setDishId(int dishId) {
        this.dishId = dishId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPrepTime() {
        return prepTime;
    }

    public void setPrepTime(String prepTime) {
        this.prepTime = prepTime;
    }

    public boolean isAvailable() {
        return isAvailable;
    }

    public void setAvailable(boolean available) {
        isAvailable = available;
    }

    @Override
    public String toString() {
        return "Dish{" +
                "dishId=" + dishId +
                ", name='" + name + '\'' +
                ", category='" + category + '\'' +
                ", price=" + price +
                ", prepTime='" + prepTime + '\'' +
                ", isAvailable=" + isAvailable +
                '}';
    }
}

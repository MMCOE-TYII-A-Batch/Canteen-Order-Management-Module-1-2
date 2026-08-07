-- CAMPUS CANTEEN MANAGEMENT SYSTEM - DATABASE SCRIPT (canteen_management.sql)

CREATE DATABASE IF NOT EXISTS canteen_management;
USE canteen_management;

-- Drop existing tables
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- TABLE 1: roles

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- TABLE 2: users

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    college_id VARCHAR(50) NOT NULL, -- Student ID or Employee ID
    department VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    status ENUM('Active', 'Suspended') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- TABLE 3: categories

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- TABLE 4: dishes

CREATE TABLE dishes (
    dish_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(8, 2) NOT NULL,
    description TEXT,
    ingredients TEXT,
    allergens VARCHAR(255),
    nutrition VARCHAR(100),
    prep_time VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    is_offer BOOLEAN DEFAULT FALSE,
    is_combo BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- TABLE 5: orders

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('New', 'Preparing', 'Prepared', 'Ready For Delivery', 'Out For Delivery', 'Delivered', 'Cancelled') DEFAULT 'New',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- TABLE 6: order_items

CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    dish_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(8, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(dish_id) ON DELETE CASCADE
);


-- SAMPLE DATA INSERTION

-- 1. Insert Roles
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'Student', 'College Student user permitted to order food'),
(2, 'Manager', 'Canteen Manager with system administration access'),
(3, 'Staff', 'Kitchen & Delivery operational staff member');

-- 2. Insert 5 Users (1 Manager, 2 Staff, 2 Students)
INSERT INTO users (user_id, name, email, phone, college_id, department, password, role_id, status) VALUES
(1, 'Rahul Sharma', 'rahul@college.edu', '9876543210', 'CS-2024-042', 'Computer Engineering', 'pass123', 1, 'Active'),
(2, 'Priya Patel', 'priya@college.edu', '9876543211', 'IT-2024-015', 'IT Engineering', 'pass123', 1, 'Active'),
(3, 'Sanjay Kumar', 'sanjay@college.edu', '9876543212', 'MGR-101', 'Canteen Mgmt', 'admin123', 2, 'Active'),
(4, 'Amit Verma', 'amit@college.edu', '9876543213', 'STF-201', 'Kitchen Staff', 'staff123', 3, 'Active'),
(5, 'Ramesh Singh', 'ramesh@college.edu', '9876543214', 'STF-202', 'Delivery Staff', 'staff123', 3, 'Active');

-- 3. Insert Categories
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Breakfast', 'Morning breakfast snacks & beverages'),
(2, 'Meals', 'Full course thali & lunch items'),
(3, 'Snacks', 'Quick bite fast food and rolls'),
(4, 'Beverages', 'Hot & cold drinks');

-- 4. Insert 10 Sample Dishes
INSERT INTO dishes (dish_id, name, category_id, price, description, ingredients, allergens, nutrition, prep_time, is_available, is_offer, is_combo, is_recommended, image_url) VALUES
(1, 'Veg Cheese Burger', 3, 80.00, 'Crispy patty with fresh cheese and sauce.', 'Potato, Cheese, Bun, Spices', 'Gluten, Dairy', '350 kcal', '10 mins', TRUE, TRUE, FALSE, TRUE, 'assets/images/burger.jpg'),
(2, 'Paneer Pizza', 2, 150.00, 'Fresh mozzarella and spiced paneer cubes.', 'Flour, Paneer, Mozzarella', 'Gluten, Milk', '520 kcal', '15 mins', TRUE, FALSE, TRUE, TRUE, 'assets/images/pizza.jpg'),
(3, 'Special Veg Thali', 2, 120.00, '2 Curries, Dal, Rice, 3 Roti, Sweet & Salad.', 'Wheat, Rice, Pulses, Vegetables', 'Gluten, Dairy', '650 kcal', '12 mins', TRUE, TRUE, TRUE, TRUE, 'assets/images/thali.jpg'),
(4, 'Masala Dosa', 1, 60.00, 'Crispy crepe served with chutney & sambar.', 'Rice, Lentils, Potato', 'Mustard', '280 kcal', '8 mins', TRUE, FALSE, FALSE, FALSE, 'assets/images/thali.jpg'),
(5, 'Cold Coffee', 4, 50.00, 'Blended chilled coffee topped with ice cream.', 'Milk, Coffee, Sugar', 'Dairy', '210 kcal', '5 mins', TRUE, FALSE, FALSE, TRUE, 'assets/images/burger.jpg'),
(6, 'Chole Bhature', 1, 90.00, 'Spiced chickpea curry with fluffy bhaturas.', 'Flour, Chickpeas, Spices', 'Gluten', '480 kcal', '10 mins', TRUE, FALSE, FALSE, TRUE, 'assets/images/thali.jpg'),
(7, 'Samosa Pav (2 Pcs)', 3, 30.00, 'Crispy potato samosa served in fresh pav.', 'Potato, Flour, Chutney', 'Gluten', '220 kcal', '3 mins', TRUE, FALSE, FALSE, FALSE, 'assets/images/burger.jpg'),
(8, 'Paneer Kathi Roll', 3, 70.00, 'Grilled paneer wrapped in flatbread.', 'Paneer, Wheat, Onion, Sauce', 'Gluten, Dairy', '310 kcal', '8 mins', TRUE, TRUE, FALSE, FALSE, 'assets/images/pizza.jpg'),
(9, 'Masala Chai', 4, 15.00, 'Traditional Indian spiced hot milk tea.', 'Tea, Milk, Ginger, Cardamom', 'Dairy', '80 kcal', '3 mins', TRUE, FALSE, FALSE, TRUE, 'assets/images/burger.jpg'),
(10, 'Gulab Jamun (2 Pcs)', 4, 40.00, 'Warm milk solid dumplings in sugar syrup.', 'Milk Solids, Sugar, Flour', 'Dairy, Gluten', '260 kcal', '2 mins', TRUE, FALSE, FALSE, FALSE, 'assets/images/thali.jpg');

-- 5. Insert 5 Sample Orders
INSERT INTO orders (order_id, user_id, total_amount, status, order_date) VALUES
(101, 1, 160.00, 'New', '2026-08-06 12:30:00'),
(102, 2, 150.00, 'Preparing', '2026-08-06 12:35:00'),
(103, 1, 120.00, 'Prepared', '2026-08-06 12:40:00'),
(104, 2, 120.00, 'Ready For Delivery', '2026-08-06 12:45:00'),
(105, 1, 100.00, 'Delivered', '2026-08-06 12:15:00');

-- 6. Insert Order Items
INSERT INTO order_items (order_item_id, order_id, dish_id, quantity, unit_price, subtotal) VALUES
(1, 101, 1, 2, 80.00, 160.00),
(2, 102, 2, 1, 150.00, 150.00),
(3, 103, 3, 1, 120.00, 120.00),
(4, 104, 4, 2, 60.00, 120.00),
(5, 105, 5, 2, 50.00, 100.00);

-- Query verification check
SELECT 'Database schema and sample data successfully initialized!' AS StatusMessage;

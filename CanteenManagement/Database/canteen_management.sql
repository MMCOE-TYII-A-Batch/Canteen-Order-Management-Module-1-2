-- CAMPUS CANTEEN MANAGEMENT SYSTEM - EXPANDED DATABASE SCRIPT (canteen_management.sql)
-- Compliant with User/Role Management & Menu/Dish Management Specifications

CREATE DATABASE IF NOT EXISTS canteen_management;
USE canteen_management;

-- Drop existing tables
DROP TABLE IF EXISTS user_feedback;
DROP TABLE IF EXISTS order_change_logs;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- TABLE 1: roles (Customer/Student, Manager, Kitchen Staff, Inventory Staff, Cashier, Procurement Staff, Delivery Staff, Administrator)
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- TABLE 2: users (With dietary preferences and default location)
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
    dietary_preferences VARCHAR(255) DEFAULT 'None',
    default_location VARCHAR(255) DEFAULT 'Main Canteen Counter',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- TABLE 3: audit_logs (Maintains audit trail of login, password reset, role assignment, status changes)
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- TABLE 4: categories (Breakfast, Lunch, Snacks, Beverages, Combos)
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- TABLE 5: dishes (With tax rate, serving window, stock quantity, allergen & nutrition attributes)
CREATE TABLE dishes (
    dish_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(8, 2) NOT NULL,
    tax_rate DECIMAL(4, 2) DEFAULT 5.00,
    description TEXT,
    ingredients TEXT,
    allergens VARCHAR(255),
    nutrition VARCHAR(100),
    prep_time VARCHAR(50),
    serving_window VARCHAR(100) DEFAULT 'All Day',
    stock_quantity INT DEFAULT 50,
    is_available BOOLEAN DEFAULT TRUE,
    is_offer BOOLEAN DEFAULT FALSE,
    is_combo BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    discount_percent DECIMAL(4, 2) DEFAULT 0.00,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- TABLE 6: orders
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    delivery_address VARCHAR(500) NOT NULL DEFAULT 'Main Canteen Counter',
    payment_status ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
    status ENUM('New', 'Preparing', 'Prepared', 'Ready For Delivery', 'Out For Delivery', 'Delivered', 'Cancelled') DEFAULT 'New',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- TABLE 7: order_items
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

-- TABLE 10: order_change_logs (Tracks quantity removals and partial order cancellations)
CREATE TABLE order_change_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT,
    dish_id INT,
    action VARCHAR(50) NOT NULL DEFAULT 'PARTIAL_CANCEL',
    removed_quantity INT DEFAULT 0,
    amount_adjusted DECIMAL(10, 2) DEFAULT 0.00,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (dish_id) REFERENCES dishes(dish_id) ON DELETE SET NULL
);

-- TABLE 9: user_delivery_addresses (Store saved delivery addresses per user)
CREATE TABLE user_delivery_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address VARCHAR(500) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_address (user_id, address)
);

-- TABLE 11: user_feedback (Dish-specific feedback tracking)
CREATE TABLE user_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dish_id INT NOT NULL,
    order_id INT,
    rating INT DEFAULT 5,
    comments TEXT,
    status ENUM('Open', 'Resolved') DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(dish_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_dish_feedback (user_id, dish_id)
);


-- SEED DATA

-- 1. Insert 8 System Roles
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'Customer', 'Student or Faculty Customer purchasing food'),
(2, 'Manager', 'Canteen Operations Manager'),
(3, 'Kitchen Staff', 'Kitchen preparation staff'),
(4, 'Inventory Staff', 'Stock and inventory controller'),
(5, 'Cashier', 'POS Counter Cashier'),
(6, 'Procurement Staff', 'Ingredient supply procurement officer'),
(7, 'Delivery Staff', 'Campus food delivery executive'),
(8, 'Administrator', 'System Administrator with full access control');

-- 2. Insert Users
INSERT INTO users (user_id, name, email, phone, college_id, department, password, role_id, status, dietary_preferences, default_location) VALUES
(1, 'Rahul Sharma', 'rahul@college.edu', '9876543210', 'CS-2024-042', 'Computer Engineering', '8d156015d5588109fe09535e770d87d011be10ab3a0b5ab439405cef226903d4', 1, 'Active', 'Vegetarian', 'Hostel Block A'),
(2, 'Priya Patel', 'priya@college.edu', '9876543211', 'IT-2024-015', 'IT Engineering', '8d156015d5588109fe09535e770d87d011be10ab3a0b5ab439405cef226903d4', 1, 'Active', 'Jain', 'Library Gate'),
(3, 'Sanjay Kumar', 'sanjay@college.edu', '9876543212', 'MGR-101', 'Canteen Mgmt', '66d260b2c7a31ebb3f91fd4dd383fbca027ac340ceb222b2f69d124b7441e6d9', 2, 'Active', 'None', 'Main Admin Office'),
(4, 'Amit Verma', 'amit@college.edu', '9876543213', 'STF-201', 'Kitchen Staff', '5b0ebe2e8caaab06af07e8973dd186fa1ef2a90a3ec06db1830bb3efd63945af', 3, 'Active', 'None', 'Kitchen Counter'),
(5, 'Ramesh Singh', 'ramesh@college.edu', '9876543214', 'STF-202', 'Delivery Staff', '5b0ebe2e8caaab06af07e8973dd186fa1ef2a90a3ec06db1830bb3efd63945af', 7, 'Active', 'None', 'Dispatch Desk'),
(6, 'Super Admin', 'admin@college.edu', '9876543299', 'ADM-001', 'IT Support', '66d260b2c7a31ebb3f91fd4dd383fbca027ac340ceb222b2f69d124b7441e6d9', 8, 'Active', 'None', 'System Desk');

-- 3. Insert Categories
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Breakfast', 'Morning breakfast snacks & hot drinks'),
(2, 'Lunch', 'Full course thali & meal items'),
(3, 'Snacks', 'Quick bite fast food and rolls'),
(4, 'Beverages', 'Hot & cold drinks'),
(5, 'Combos', 'Value combination meal packs');

-- 4. Insert Dishes
INSERT INTO dishes (dish_id, name, category_id, price, tax_rate, description, ingredients, allergens, nutrition, prep_time, serving_window, stock_quantity, is_available, is_offer, is_combo, is_recommended, discount_percent, image_url) VALUES
(1, 'Veg Cheese Burger', 3, 80.00, 5.00, 'Crispy patty with fresh cheese and sauce.', 'Potato, Cheese, Bun, Spices', 'Gluten, Dairy', '350 kcal', '10 mins', '10:00 AM - 8:00 PM', 40, TRUE, TRUE, FALSE, TRUE, 10.00, 'assets/images/burger.jpg'),
(2, 'Paneer Pizza', 5, 150.00, 5.00, 'Fresh mozzarella and spiced paneer cubes.', 'Flour, Paneer, Mozzarella', 'Gluten, Milk', '520 kcal', '15 mins', '11:00 AM - 9:00 PM', 25, TRUE, FALSE, TRUE, TRUE, 0.00, 'assets/images/pizza.jpg'),
(3, 'Special Veg Thali', 2, 120.00, 5.00, '2 Curries, Dal, Rice, 3 Roti, Sweet & Salad.', 'Wheat, Rice, Pulses, Vegetables', 'Gluten, Dairy', '650 kcal', '12 mins', '12:00 PM - 3:00 PM', 50, TRUE, TRUE, TRUE, TRUE, 5.00, 'assets/images/thali.jpg'),
(4, 'Masala Dosa', 1, 60.00, 5.00, 'Crispy crepe served with chutney & sambar.', 'Rice, Lentils, Potato', 'Mustard', '280 kcal', '8 mins', '7:30 AM - 11:30 AM', 30, TRUE, FALSE, FALSE, FALSE, 0.00, 'assets/images/thali.jpg'),
(5, 'Cold Coffee', 4, 50.00, 5.00, 'Blended chilled coffee topped with ice cream.', 'Milk, Coffee, Sugar', 'Dairy', '210 kcal', '5 mins', 'All Day', 60, TRUE, FALSE, FALSE, TRUE, 0.00, 'assets/images/burger.jpg'),
(6, 'Chole Bhature', 1, 90.00, 5.00, 'Spiced chickpea curry with fluffy bhaturas.', 'Flour, Chickpeas, Spices', 'Gluten', '480 kcal', '10 mins', '8:00 AM - 12:00 PM', 20, TRUE, FALSE, FALSE, TRUE, 0.00, 'assets/images/thali.jpg');

-- 5. Insert Orders
INSERT INTO orders (order_id, user_id, total_amount, tax_amount, delivery_address, status, order_date) VALUES
(101, 1, 160.00, 8.00, 'Hostel Block A', 'New', '2026-08-06 12:30:00'),
(102, 2, 150.00, 7.50, 'Library Gate', 'Preparing', '2026-08-06 12:35:00'),
(103, 1, 120.00, 6.00, 'Hostel Block A', 'Prepared', '2026-08-06 12:40:00');

-- 6. Insert Order Items
INSERT INTO order_items (order_item_id, order_id, dish_id, quantity, unit_price, subtotal) VALUES
(1, 101, 1, 2, 80.00, 160.00),
(2, 102, 2, 1, 150.00, 150.00),
(3, 103, 3, 1, 120.00, 120.00);

-- 7. Insert Sample Audit Log
INSERT INTO audit_logs (user_id, action, details) VALUES
(1, 'LOGIN', 'User Rahul Sharma logged in from IP 192.168.1.10'),
(3, 'ROLE_ASSIGNMENT', 'Administrator assigned role Manager to Sanjay Kumar');

SELECT 'Expanded database schema created successfully!' AS StatusMessage;

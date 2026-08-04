-- =====================================================
-- Campus Canteen Management System
-- User & Role Management Module
-- =====================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS canteen_management;

-- Select Database
USE canteen_management;

-- =====================================================
-- TABLE 1 : ROLES
-- =====================================================

CREATE TABLE roles
(
    role_id INT AUTO_INCREMENT PRIMARY KEY,

    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- =====================================================
-- SAMPLE DATA : ROLES
-- =====================================================

INSERT INTO roles (role_name)
VALUES
('Customer'),
('Manager'),
('Kitchen Staff'),
('Inventory Staff'),
('Cashier'),
('Procurement Staff'),
('Delivery Staff'),
('Administrator');


-- =====================================================
-- TABLE 2 : USERS
-- =====================================================

CREATE TABLE users
(
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    role_id INT NOT NULL,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(100) UNIQUE,

    mobile VARCHAR(15) UNIQUE,

    employee_student_id VARCHAR(30) UNIQUE,

    password VARCHAR(255) NOT NULL,

    department VARCHAR(100),

    dietary_preference ENUM('Veg','Non-Veg','Vegan','Jain','None')
        DEFAULT 'None',

    pickup_location VARCHAR(100),

    delivery_location VARCHAR(100),

    status ENUM('Active','Suspended')
        DEFAULT 'Active',

    created_at DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
);

-- =====================================================
-- SAMPLE DATA : USERS
-- =====================================================

INSERT INTO users
(
    role_id,
    full_name,
    email,
    mobile,
    employee_student_id,
    password,
    department,
    dietary_preference,
    pickup_location,
    delivery_location
)
VALUES
(
    1,
    'Rahul Sharma',
    'rahul@gmail.com',
    '9876543210',
    'STU101',
    '123456',
    'Computer Engineering',
    'Veg',
    'Main Counter',
    'Hostel A'
),
(
    2,
    'Priya Patil',
    'priya@gmail.com',
    '9876543211',
    'EMP201',
    '123456',
    'Administration',
    'None',
    'Office',
    'Office'
);

-- =====================================================
-- TABLE 3 : LOGIN_AUDIT
-- =====================================================

CREATE TABLE login_audit
(
    audit_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    login_time DATETIME NOT NULL,

    logout_time DATETIME,

    login_status ENUM('Success','Failed') NOT NULL,

    CONSTRAINT fk_login_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

-- =====================================================
-- SAMPLE DATA : LOGIN_AUDIT
-- =====================================================

INSERT INTO login_audit
(
    user_id,
    login_time,
    logout_time,
    login_status
)
VALUES
(
    1,
    '2026-08-04 09:00:00',
    '2026-08-04 09:45:00',
    'Success'
),
(
    2,
    '2026-08-04 10:00:00',
    NULL,
    'Failed'
);

-- =====================================================
-- TABLE 4 : USER_ACTIVITY
-- =====================================================

CREATE TABLE user_activity
(
    activity_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    activity_type VARCHAR(50) NOT NULL,

    activity_details VARCHAR(255),

    activity_time DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

-- =====================================================
-- SAMPLE DATA : USER_ACTIVITY
-- =====================================================

INSERT INTO user_activity
(
    user_id,
    activity_type,
    activity_details
)
VALUES
(
    1,
    'Profile Updated',
    'Updated pickup location to Main Counter'
),
(
    2,
    'Password Reset',
    'Password reset by Administrator'
),
(
    2,
    'Role Assigned',
    'Assigned Manager role'
);

-- =====================================================
-- TABLE 5 : ORDERS
-- =====================================================

CREATE TABLE orders
(
    order_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    order_date DATETIME NOT NULL,

    total_amount DECIMAL(10,2) NOT NULL,

    order_status ENUM
    (
        'Pending',
        'Preparing',
        'Ready',
        'Completed',
        'Cancelled'
    )
    DEFAULT 'Pending',

    CONSTRAINT fk_order_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

-- =====================================================
-- SAMPLE DATA : ORDERS
-- =====================================================

INSERT INTO orders
(
    user_id,
    order_date,
    total_amount,
    order_status
)
VALUES
(
    1,
    '2026-08-04 12:15:00',
    180.00,
    'Completed'
),
(
    2,
    '2026-08-04 01:10:00',
    95.50,
    'Preparing'
);

-- =====================================================
-- TABLE 6 : INVOICES
-- =====================================================

CREATE TABLE invoices
(
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,

    order_id INT NOT NULL,

    invoice_date DATETIME NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    payment_status ENUM
    (
        'Paid',
        'Unpaid',
        'Refunded'
    )
    DEFAULT 'Paid',

    CONSTRAINT fk_invoice_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

-- =====================================================
-- SAMPLE DATA : INVOICES
-- =====================================================

INSERT INTO invoices
(
    order_id,
    invoice_date,
    amount,
    payment_status
)
VALUES
(
    1,
    '2026-08-04 12:20:00',
    180.00,
    'Paid'
),
(
    2,
    '2026-08-04 01:15:00',
    95.50,
    'Unpaid'
);

-- =====================================================
-- TABLE 7 : COMPLAINTS
-- =====================================================

CREATE TABLE complaints
(
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    order_id INT NOT NULL,

    complaint_text TEXT NOT NULL,

    complaint_date DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    complaint_status ENUM
    (
        'Open',
        'In Progress',
        'Resolved',
        'Rejected'
    )
    DEFAULT 'Open',

    CONSTRAINT fk_complaint_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_complaint_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

-- =====================================================
-- SAMPLE DATA : COMPLAINTS
-- =====================================================

INSERT INTO complaints
(
    user_id,
    order_id,
    complaint_text,
    complaint_status
)
VALUES
(
    1,
    1,
    'Food was delivered cold.',
    'Resolved'
),
(
    2,
    2,
    'Order is taking too long.',
    'Open'
);

-- =====================================================
-- TABLE 8 : FEEDBACK
-- =====================================================

CREATE TABLE feedback
(
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    order_id INT NOT NULL,

    rating INT CHECK (rating BETWEEN 1 AND 5),

    comments TEXT,

    feedback_date DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    feedback_status ENUM
    (
        'Pending',
        'Reviewed'
    )
    DEFAULT 'Pending',

    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_feedback_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

-- =====================================================
-- SAMPLE DATA : FEEDBACK
-- =====================================================

INSERT INTO feedback
(
    user_id,
    order_id,
    rating,
    comments,
    feedback_status
)
VALUES
(
    1,
    1,
    5,
    'Excellent food and quick service.',
    'Reviewed'
),
(
    2,
    2,
    4,
    'Good food, waiting time was a bit long.',
    'Pending'
);
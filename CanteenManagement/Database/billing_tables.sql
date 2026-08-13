-- Billing and Payments schema for Campus Canteen
-- Run this on your MySQL server to create necessary tables

CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  method VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
  gateway_reference VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order (order_id)
);

CREATE TABLE IF NOT EXISTS refunds (
  refund_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(30) DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, REJECTED, COMPLETED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment (payment_id),
  INDEX idx_order (order_id)
);

CREATE TABLE IF NOT EXISTS settlements (
  settlement_id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simple invoices table (one invoice per order payment)
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_id INT,
  invoice_number VARCHAR(50) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  service_charge DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order (order_id)
);

-- Note: ensure your `orders` table exists and has order_id primary key

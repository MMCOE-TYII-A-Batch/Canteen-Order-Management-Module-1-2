-- =====================================================
-- Campus Canteen Management System
-- Menu & Dish Management Module
-- =====================================================

USE canteen_management;

-- =====================================================
-- TABLE 1 : CATEGORIES
-- =====================================================

CREATE TABLE categories
(
    category_id INT AUTO_INCREMENT PRIMARY KEY,

    category_name VARCHAR(50) NOT NULL UNIQUE,

    description VARCHAR(200),

    status ENUM('Active','Inactive')
        DEFAULT 'Active'
);

-- =====================================================
-- SAMPLE DATA : CATEGORIES
-- =====================================================

INSERT INTO categories
(
    category_name,
    description
)
VALUES
(
    'Breakfast',
    'Morning meals'
),
(
    'Lunch',
    'Afternoon meals'
),
(
    'Snacks',
    'Light snacks'
),
(
    'Beverages',
    'Hot and cold drinks'
),
(
    'Combos',
    'Special combo meals'
);

-- =====================================================
-- TABLE 2 : DISHES
-- =====================================================

CREATE TABLE dishes
(
    dish_id INT AUTO_INCREMENT PRIMARY KEY,

    category_id INT NOT NULL,

    dish_name VARCHAR(100) NOT NULL,

    description TEXT,

    ingredients TEXT,

    allergen_details VARCHAR(255),

    nutrition_tags VARCHAR(255),

    image VARCHAR(255),

    price DECIMAL(10,2) NOT NULL,

    tax_rate DECIMAL(5,2)
        DEFAULT 0.00,

    preparation_time INT,

    serving_start TIME,

    serving_end TIME,

    is_recommended BOOLEAN
        DEFAULT FALSE,

    is_special BOOLEAN
        DEFAULT FALSE,

    popularity INT
        DEFAULT 0,

    availability ENUM('Available','Unavailable')
        DEFAULT 'Available',

    status ENUM('Active','Inactive')
        DEFAULT 'Active',

    CONSTRAINT fk_dish_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
);

-- =====================================================
-- SAMPLE DATA : DISHES
-- =====================================================

INSERT INTO dishes
(
    category_id,
    dish_name,
    description,
    ingredients,
    allergen_details,
    nutrition_tags,
    image,
    price,
    tax_rate,
    preparation_time,
    serving_start,
    serving_end,
    is_recommended,
    is_special
)
VALUES
(
    1,
    'Poha',
    'Traditional Maharashtrian breakfast',
    'Rice flakes, onion, peanuts',
    'Peanuts',
    'Veg',
    'images/poha.jpg',
    35.00,
    5.00,
    10,
    '07:00:00',
    '11:00:00',
    TRUE,
    FALSE
),
(
    4,
    'Cold Coffee',
    'Chilled coffee with milk',
    'Milk, coffee, sugar',
    'Milk',
    'Vegetarian',
    'images/cold_coffee.jpg',
    60.00,
    5.00,
    5,
    '10:00:00',
    '20:00:00',
    TRUE,
    TRUE
);

-- =====================================================
-- TABLE 3 : MENUS
-- =====================================================

CREATE TABLE menus
(
    menu_id INT AUTO_INCREMENT PRIMARY KEY,

    menu_name VARCHAR(100) NOT NULL,

    menu_type ENUM('Daily','Weekly','Event') NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status ENUM('Active','Inactive')
        DEFAULT 'Active'
);

-- =====================================================
-- SAMPLE DATA : MENUS
-- =====================================================

INSERT INTO menus
(
    menu_name,
    menu_type,
    start_date,
    end_date
)
VALUES
(
    'Monday Breakfast Menu',
    'Daily',
    '2026-08-04',
    '2026-08-04'
),
(
    'Independence Day Special',
    'Event',
    '2026-08-15',
    '2026-08-15'
);

-- =====================================================
-- TABLE 4 : MENU_ITEMS
-- =====================================================

CREATE TABLE menu_items
(
    menu_item_id INT AUTO_INCREMENT PRIMARY KEY,

    menu_id INT NOT NULL,

    dish_id INT NOT NULL,

    CONSTRAINT fk_menu_item_menu
        FOREIGN KEY (menu_id)
        REFERENCES menus(menu_id),

    CONSTRAINT fk_menu_item_dish
        FOREIGN KEY (dish_id)
        REFERENCES dishes(dish_id)
);

-- =====================================================
-- SAMPLE DATA : MENU_ITEMS
-- =====================================================

INSERT INTO menu_items
(
    menu_id,
    dish_id
)
VALUES
(
    1,
    1
),
(
    2,
    2
);

-- =====================================================
-- TABLE 5 : OFFERS
-- =====================================================

CREATE TABLE offers
(
    offer_id INT AUTO_INCREMENT PRIMARY KEY,

    dish_id INT,

    offer_name VARCHAR(100) NOT NULL,

    offer_type ENUM('Discount','Combo') NOT NULL,

    discount_percent DECIMAL(5,2),

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status ENUM('Active','Inactive')
        DEFAULT 'Active',

    CONSTRAINT fk_offer_dish
        FOREIGN KEY (dish_id)
        REFERENCES dishes(dish_id)
);

-- =====================================================
-- SAMPLE DATA : OFFERS
-- =====================================================

INSERT INTO offers
(
    dish_id,
    offer_name,
    offer_type,
    discount_percent,
    start_date,
    end_date
)
VALUES
(
    1,
    'Breakfast Discount',
    'Discount',
    10.00,
    '2026-08-04',
    '2026-08-10'
),
(
    NULL,
    'Combo Meal Offer',
    'Combo',
    15.00,
    '2026-08-05',
    '2026-08-20'
);

-- =====================================================
-- TABLE 6 : STOCK
-- =====================================================

CREATE TABLE stock
(
    stock_id INT AUTO_INCREMENT PRIMARY KEY,

    dish_id INT NOT NULL,

    available_quantity INT NOT NULL,

    minimum_quantity INT
        DEFAULT 5,

    last_updated DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_dish
        FOREIGN KEY (dish_id)
        REFERENCES dishes(dish_id)
);

-- =====================================================
-- SAMPLE DATA : STOCK
-- =====================================================

INSERT INTO stock
(
    dish_id,
    available_quantity,
    minimum_quantity
)
VALUES
(
    1,
    50,
    5
),
(
    2,
    20,
    5
);

-- =====================================================
-- TABLE 7 : PRICE_HISTORY
-- =====================================================

CREATE TABLE price_history
(
    history_id INT AUTO_INCREMENT PRIMARY KEY,

    dish_id INT NOT NULL,

    old_price DECIMAL(10,2) NOT NULL,

    new_price DECIMAL(10,2) NOT NULL,

    updated_at DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_price_dish
        FOREIGN KEY (dish_id)
        REFERENCES dishes(dish_id)
);

-- =====================================================
-- SAMPLE DATA : PRICE_HISTORY
-- =====================================================

INSERT INTO price_history
(
    dish_id,
    old_price,
    new_price
)
VALUES
(
    1,
    30.00,
    35.00
),
(
    2,
    55.00,
    60.00
);
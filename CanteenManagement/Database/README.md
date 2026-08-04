#  Canteen Order Management System

##  About the Project

The **Canteen Order Management System** is a web-based application developed using **Java, JSP, Servlets, JDBC, and MySQL**. It helps manage canteen operations such as users, menus, dishes, orders, invoices, stock, feedback, and complaints through a centralized database.

---

##  Database

**Database Name**

```sql
canteen_order_management
```

### Database Tables

- users
- roles
- categories
- dishes
- menus
- menu_items
- orders
- invoices
- stock
- offers
- feedback
- complaints
- login_audit
- user_activity
- price_history

---

##  Database Setup

Create the database:

```sql
CREATE DATABASE canteen_order_management;
USE canteen_order_management;
```

Import the SQL files:

- `EDI-module2-DB.sql`
- `menu_module.sql`

---

##  Database Design

The database is designed using:

- Primary Keys
- Foreign Keys
- One-to-Many Relationships
- Normalized Tables

These relationships help maintain data consistency and reduce data duplication.

---

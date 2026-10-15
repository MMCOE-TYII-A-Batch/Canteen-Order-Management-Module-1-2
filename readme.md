1) User and role management
Functional requirements
* The system shall allow users to register with mobile number, email, employee ID, or student ID, depending on organization policy. COMPLETED
* The system shall support secure login and logout for all registered users. COMPLETED
* The system shall support role-based access control for customer, manager, kitchen staff, inventory staff, cashier, procurement staff, delivery staff, and administrator. COMPLETED
* The system shall allow users to update profile data such as name, department, contact details, dietary preferences, and default pickup or delivery location. COMPLETED
* The system shall allow users to view order history, invoices, complaints, and feedback status. COMPLETED 
* The system shall allow administrators to activate, suspend, reset, or delete user accounts. COMPLETED 
* The system shall maintain an audit trail of login, password reset, role assignment, and account status changes. COMPLETED

2)Menu and dish management
Functional requirements
* The system shall allow authorized staff to add, edit, activate, deactivate, and delete dishes. COMPLETED
* The system shall allow dishes to be grouped by category such as breakfast, lunch, snacks, beverages, and combos. COMPLETED
* The system shall store dish attributes including name, description, ingredients, allergen details, nutrition tags, image, price, tax rate, preparation time, and serving window. COMPLETED
* The system shall allow publication of daily, weekly, or event-based menus. COMPLETED
* The system shall support recommended dishes, special dishes, discounts, combo offers, and time-based availability. COMPLETED
* The system shall automatically mark items unavailable when linked stock is insufficient. COMPLETED
* The system shall allow sorting and searching by category, keyword, price, popularity, and availability, reflecting common canteen UI requirements for category navigation and price or sales sorting. COMPLETED

3) Order management
Functional requirements
* The system shall allow customers to add one or more items to a cart and modify quantity before checkout. COMPLETED
* The system shall support order types such as dine-in, takeaway, counter pickup, and workstation or hostel delivery, where applicable. COMPLETED
* The system shall capture delivery location or pickup counter and selected service time. COMPLETED
* The system shall validate item availability, quantity limits, pricing, taxes, offers, and cutoff times before order confirmation. COMPLETED
* The system shall generate a unique order number for each confirmed order. COMPLETED
* The system shall send confirmed orders in real time to the kitchen or merchant console. COMPLETED
* The system shall track statuses such as placed, accepted, in preparation, ready, out for delivery, delivered, completed, cancelled, and refunded. COMPLETED
* The system shall allow users and staff to search and filter orders by date, user, status, counter, and order number. COMPLETED
* The system shall support order cancellation, partial cancellation before preparation, and refund initiation based on policy. COMPLETED
* The system shall generate electronic receipts or order vouchers. COMPLETED

4)Payment and billing
* The system shall support multiple payment methods such as UPI, cards, wallets, cash, payroll deduction, campus card, or institution-approved gateways. COMPLETED
* The system shall calculate subtotal, taxes, service charges, discounts, coupon value, and final payable amount. COMPLETED
* The system shall integrate with external payment gateways and capture payment callback status. COMPLETED
* The system shall update the order payment status after successful payment confirmation. COMPLETED
* The system shall support pending, paid, failed, refunded, and partially refunded billing states. COMPLETED
* The system shall generate tax invoices, payment receipts, and settlement summaries. COMPLETED
* The system shall allow authorized staff to record cash payments and manual adjustments. COMPLETED
* The system shall support refund workflows with reason capture and approval, where applicable. COMPLETED

5) client server architecture
* client server architecture -COMPLETED
* session of client -- COMPLETED
* secure communication between client server-COMPLETED
* handle multiple queries from multiple clients -COMPLETED
* data structure required for internal queries-COMPLETED
* efficiency of the system-COMPLETED

6)Inventory and stock management
• The system shall maintain stock records for raw materials and consumables, including unit of measure, current balance, reorder level, batch number, purchase date, expiry date, and storage location.-COMPLETED
• The system shall support stock inward, stock issue to kitchen, stock transfer, stock adjustment, and stock write-off for wastage or spoilage.-COMPLETED
• The system shall update stock balances in real time after goods receipt, recipe consumption, or manual adjustment, aligning with the requirement for real-time inventory monitoring.-COMPLETED
• The system shall generate low-stock, out-of-stock, and near-expiry alerts.-COMPLETED
• The system shall support item-wise consumption tracking based on order volume or production issue.-COMPLETED
• The system shall maintain wastage records with reason codes such as expired, damaged, overproduction, or pilferage.-COMPLETED
• The system shall support periodic stock count and variance reconciliation.-COMPLETED
• The system shall provide stock valuation and daily inventory position reports.-COMPLETED


7) Procurement and supplier management
• The system shall maintain supplier records including contact details, GST or tax details, supplied categories, lead time, and performance notes.-COMPLETED
• The system shall allow authorized staff to raise purchase requisitions based on low-stock alerts, forecast demand, or manual request.-COMPLETED
• The system shall allow creation, approval, and issue of purchase orders to selected suppliers.-COMPLETED
• The system shall record goods receipt against purchase orders with quantity, accepted quantity, rejected quantity, unit price, and batch details.-COMPLETED
• The system shall support supplier invoice capture and matching with purchase order and goods receipt.-COMPLETED
• The system shall track pending, partially received, completed, and cancelled purchase orders.-COMPLETED
• The system shall produce supplier-wise purchase history and price comparison reports.-COMPLETED



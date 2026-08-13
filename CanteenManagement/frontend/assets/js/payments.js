function getOrderApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/order${queryString}`;
  }
  return `${window.location.origin}${contextPath}/order${queryString}`;
}

function getPaymentApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/payment${queryString}`;
  }
  return `${window.location.origin}${contextPath}/payment${queryString}`;
}

function getAddressApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/address${queryString}`;
  }
  return `${window.location.origin}${contextPath}/address${queryString}`;
}

// Create order on backend before payment
async function createOrderOnBackend(userId, items, deliveryAddress, totalAmount) {
  try {
    console.log(`📝 Creating order on backend: userId=${userId}, items=${items.length}, address="${deliveryAddress}", total=${totalAmount}`);
    
    // Validate inputs
    if (!userId) {
      console.error('❌ Missing userId');
      showNotification('❌ User ID is required. Please log in again.', 'error');
      return null;
    }
    
    if (totalAmount <= 0) {
      console.error('❌ Invalid total amount');
      showNotification('❌ Order total must be greater than 0.', 'error');
      return null;
    }
    
    const form = new URLSearchParams();
    form.append('userId', userId);
    form.append('total', totalAmount);
    form.append('deliveryAddress', deliveryAddress || 'Main Canteen Counter');
    
    // Add first item as the main dish
    if (items && items.length > 0) {
      const firstItem = items[0];
      const dishId = firstItem.dishId || firstItem.id || 1;
      const quantity = items.length;
      form.append('dishId', dishId);
      form.append('quantity', quantity);
      console.log(`📦 Adding dish: dishId=${dishId}, quantity=${quantity}`);
    } else {
      console.warn('⚠️ No items provided, using default dishId=1');
      form.append('dishId', 1);
      form.append('quantity', 1);
    }

    console.log(`🌐 Sending POST request to: ${getOrderApiUrl()}`);
    const response = await fetch(getOrderApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error('❌ Failed to parse response as JSON:', parseErr);
      console.error('Response text:', await response.text());
      showNotification('❌ Server returned invalid response. Please try again.', 'error');
      return null;
    }
    
    console.log(`Response status: ${response.status}, data:`, data);
    
    if (response.ok && data.status === 'success') {
      console.log(`✅ Order created successfully! Order ID: ${data.orderId}, Address: "${deliveryAddress}"`);
      return data.orderId;
    } else {
      const errorMsg = data.message || 'Unknown error';
      console.error('⚠️ Failed to create order on backend:', errorMsg);
      console.error('Full error response:', data);
      showNotification(`❌ Order creation failed: ${errorMsg}`, 'error');
      return null;
    }
  } catch (err) {
    console.error('❌ Backend call failed:', err);
    console.error('Error details:', err.stack);
    showNotification(`❌ Cannot reach server: ${err.message}`, 'error');
    return null;
  }
}

// Helper function to get active user session with validation
function getActiveUserSession() {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) {
    console.warn("⚠️ No user session found! User may not be logged in.");
    return null;
  }
  try {
    const user = JSON.parse(userStr);
    const userId = user?.userId || user?.id;
    if (!userId) {
      console.warn("⚠️ User session exists but userId is missing!");
      return null;
    }
    return user;
  } catch (e) {
    console.error("❌ Error parsing user session:", e);
    return null;
  }
}

// Function to load saved addresses from DATABASE (backend)
async function loadSavedAddresses() {
  const user = getActiveUserSession();
  
  if (!user) {
    console.warn("Cannot load addresses: User not authenticated");
    return;
  }

  const userId = user.userId || user.id;
  const select = document.getElementById('savedAddressSelect');
  if (!select) return;

  try {
    const response = await fetch(getAddressApiUrl(`?action=listAddresses&userId=${userId}`));
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.addresses) {
        select.innerHTML = '<option value="">-- Select from saved addresses or add new --</option>';
        data.addresses.forEach(addr => {
          const option = document.createElement('option');
          option.value = addr.address;
          const displayText = (addr.isDefault ? '⭐ ' : '') + addr.address.substring(0, 50) + (addr.address.length > 50 ? '...' : '');
          option.textContent = displayText;
          select.appendChild(option);
        });
        console.log(`✅ Loaded ${data.addresses.length} addresses for user ${userId}`);
        return;
      }
    }
  } catch (err) {
    console.warn("Backend unavailable for address loading:", err);
  }

  // Fallback: Load from localStorage for backward compatibility
  console.log("📌 Using localStorage fallback for addresses");
  loadSavedAddressesFromLocalStorage(userId, select);
}

// Fallback: Load addresses from localStorage (for backward compatibility)
function loadSavedAddressesFromLocalStorage(userId, select) {
  if (!select) return;
  
  const savedAddressesKey = `saved_addresses_${userId}`;
  const savedAddresses = JSON.parse(localStorage.getItem(savedAddressesKey) || '[]');
  
  select.innerHTML = '<option value="">-- Select from saved addresses or add new --</option>';
  savedAddresses.forEach((address, index) => {
    const option = document.createElement('option');
    option.value = address;
    option.textContent = address.substring(0, 50) + (address.length > 50 ? '...' : '');
    select.appendChild(option);
  });
}

// Function to save address to DATABASE (backend)
async function saveAddressToDatabase(address, userId) {
  if (!address || address.trim() === '') return;

  try {
    const form = new URLSearchParams();
    form.append('action', 'saveAddress');
    form.append('userId', userId);
    form.append('address', address.trim());

    const response = await fetch(getAddressApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });

    const data = await response.json();
    if (response.ok && data.status === 'success') {
      console.log(`✅ Address saved to database for user ${userId}`);
      return true;
    }
  } catch (err) {
    console.warn("Backend unavailable for saving address, using localStorage fallback:", err);
  }

  // Fallback: Save to localStorage
  saveAddressToLocalStorage(address, userId);
  return true;
}

// Fallback: Save address to localStorage
function saveAddressToLocalStorage(address, userId) {
  if (!address || address.trim() === '') return;
  
  const savedAddressesKey = `saved_addresses_${userId}`;
  let savedAddresses = JSON.parse(localStorage.getItem(savedAddressesKey) || '[]');
  
  // Avoid duplicates
  if (!savedAddresses.includes(address)) {
    savedAddresses.unshift(address);
    // Keep only last 5 addresses
    if (savedAddresses.length > 5) {
      savedAddresses.pop();
    }
    localStorage.setItem(savedAddressesKey, JSON.stringify(savedAddresses));
    console.log(`📌 Address saved to localStorage for user ${userId}`);
  }
}

function computeBilling(items) {
  // items: array of {name, qty, price}
  const subtotal = items.reduce((s, it) => s + (it.price * (it.qty || 1)), 0);
  const tax = +(subtotal * 0.05).toFixed(2); // 5%
  const service = +(subtotal * 0.02).toFixed(2);
  const discount = 0.00;
  const total = +(subtotal + tax + service - discount).toFixed(2);
  return { subtotal, tax, service, discount, total };
}

async function initPayment(order, deliveryAddressParam = null) {
  // order: {orderId, items[]}
  const billing = computeBilling(order.items);
  const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'UPI';
  const deliveryAddress = deliveryAddressParam || document.getElementById('paymentDetails')?.value || 'Main Canteen Counter';
  
  console.log(`💳 Initiating payment: orderId=${order.orderId}, method=${method}, address="${deliveryAddress}"`);
  
  // Validate delivery address
  if (!deliveryAddress || deliveryAddress.trim() === '') {
    showNotification('Please enter your delivery address', 'error');
    return;
  }
  
  try {
    const form = new URLSearchParams();
    form.append('action', 'initiate');
    form.append('orderId', order.orderId);
    form.append('amount', billing.total);
    form.append('method', method);
    form.append('deliveryAddress', deliveryAddress);

    console.log(`📤 Sending payment initiation with address: "${deliveryAddress}"`);

    const res = await fetch(getPaymentApiUrl(), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      showNotification('Payment initiated. Simulating gateway...', 'info');
      console.log(`✅ Payment initiated with ID: ${data.paymentId}`);
      // Simulate redirect to gateway and immediate callback success
      setTimeout(() => {
        simulateGatewayCallback(data.paymentId, 'success', order.orderId, deliveryAddress);
      }, 700);
    } else {
      showNotification(data.message || 'Failed to initiate payment', 'error');
    }
  } catch (e) {
    console.error(e);
    showNotification('Cannot reach payment endpoint', 'error');
  }
}

async function simulateGatewayCallback(paymentId, result, orderId, deliveryAddress) {
  try {
    const form = new URLSearchParams();
    form.append('action', 'callback');
    form.append('paymentId', paymentId);
    form.append('result', result);
    if (orderId) form.append('orderId', orderId);
    if (deliveryAddress) form.append('deliveryAddress', deliveryAddress);

    const res = await fetch(getPaymentApiUrl(), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      showNotification('Payment ' + data.paymentStatus, 'success');
      
      // Get order details from cart
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdParam = urlParams.get('orderId');
      let items = [];
      const pendingCart = JSON.parse(localStorage.getItem('pending_cart') || 'null');
      const cart = JSON.parse(localStorage.getItem('canteen_cart') || '[]');
      if (pendingCart && pendingCart.length) {
        items = pendingCart.map(c => ({ name: c.name || 'Item', qty: c.quantity || c.qty || 1, price: c.price || c.unitPrice || 0 }));
      } else {
        items = cart.map(c => ({ name: c.name || 'Item', qty: c.quantity || c.qty || 1, price: c.price || c.unitPrice || 0 }));
      }

      // Generate professional receipt
      const order = { orderId: orderId || data.orderId || paymentId, items };
      generateProfessionalReceipt(order, data, deliveryAddress);

      // Clear cart upon successful payment
      clearPendingCart();
    } else {
      showNotification(data.message || 'Payment callback failed', 'error');
    }
  } catch (e) {
    console.error(e);
    showNotification('Gateway callback failed', 'error');
  }
}

async function loadPaymentsList() {
  try {
    const res = await fetch(getPaymentApiUrl('?action=listPayments'));
    if (!res.ok) throw new Error('Failed');
    const list = await res.json();
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    list.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.paymentId}</td>
        <td>${p.orderId}</td>
        <td>${p.method}</td>
        <td>₹${p.amount}</td>
        <td>${p.status}</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="triggerRefund(${p.paymentId}, ${p.amount})">Refund</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.warn('Could not load payments', e);
  }
}

// Professional Receipt Generation
function generateProfessionalReceipt(order, paymentData, deliveryAddress) {
  const receiptCard = document.getElementById('receiptCard');
  if (!receiptCard) return;

  // Store current orderId globally for cancellation
  window.currentOrderId = order.orderId;

  // Calculate billing details
  const billing = computeBilling(order.items);
  const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'UPI';

  // Set Receipt Header
  document.getElementById('receiptOrderId').textContent = `Order #${order.orderId || 'N/A'}`;
  const now = new Date();
  document.getElementById('receiptDateTime').textContent = now.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Populate Items Table
  const itemsTable = document.getElementById('receiptItemsTable');
  itemsTable.innerHTML = '';
  let itemHtml = `
    <table class="w-100 small" style="border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #dee2e6;">
          <th class="text-start py-2">Item</th>
          <th class="text-center py-2">Qty</th>
          <th class="text-end py-2">Price</th>
          <th class="text-end py-2">Total</th>
        </tr>
      </thead>
      <tbody>
  `;

  let rowClass = '';
  order.items.forEach((item, index) => {
    rowClass = index % 2 === 0 ? 'bg-light' : '';
    const itemTotal = (item.price || 0) * (item.qty || 1);
    itemHtml += `
      <tr style="border-bottom: 1px solid #dee2e6;" class="${rowClass}">
        <td class="text-start py-2"><strong>${item.name}</strong></td>
        <td class="text-center py-2">${item.qty || 1}</td>
        <td class="text-end py-2">₹${(item.price || 0).toFixed(2)}</td>
        <td class="text-end py-2">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  });

  itemHtml += `
      </tbody>
    </table>
  `;
  itemsTable.innerHTML = itemHtml;

  // Populate Billing Summary
  document.getElementById('receiptSubtotal').textContent = `₹${billing.subtotal.toFixed(2)}`;
  document.getElementById('receiptDiscount').textContent = `-₹${billing.discount.toFixed(2)}`;
  document.getElementById('receiptTaxes').textContent = `₹${billing.tax.toFixed(2)}`;
  document.getElementById('receiptTotal').textContent = `₹${billing.total.toFixed(2)}`;

  // Populate Delivery Address
  document.getElementById('receiptAddress').textContent = deliveryAddress || 'Main Canteen Counter';

  // Populate Payment Method
  document.getElementById('receiptPaymentMethod').textContent = method;

  // Show Receipt Card
  receiptCard.style.display = 'block';

  // Start 1-minute cancellation timer
  startCancellationTimer(order.orderId);
}

// Start 60-second cancellation timer
let cancellationTimerInterval = null;

// Clear all cart data (localStorage, global array, UI)
function clearAllCartData() {
  try {
    // Clear localStorage
    localStorage.removeItem('canteen_cart');
    localStorage.removeItem('pending_cart');
    
    // Clear global cartItems array (from main.js)
    if (typeof cartItems !== 'undefined') {
      cartItems = [];
    }
    
    // Update cart badge to 0
    const cartBadge = document.querySelector('.cart-badge') || document.querySelector('[data-cart-count]');
    if (cartBadge) {
      cartBadge.textContent = '0';
      cartBadge.style.display = 'none';
    }
    
    // Close cart modal if it's open
    const cartModal = document.getElementById('cartModal') || document.querySelector('[id*="cart"]');
    if (cartModal && cartModal.style.display !== 'none') {
      // Close via close button if available
      const closeBtn = cartModal.querySelector('[data-bs-dismiss="modal"]') || 
                       cartModal.querySelector('.btn-close') ||
                       cartModal.querySelector('[onclick*="close"]');
      if (closeBtn) {
        closeBtn.click();
      } else {
        cartModal.style.display = 'none';
      }
    }
    
    console.log('🧹 Cart cleared successfully: localStorage items removed, badge updated, modal closed');
  } catch (e) {
    console.error('Error clearing cart:', e);
  }
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startCancellationTimer(orderId) {
  let timeRemaining = 60;
  const countdownElement = document.getElementById('cancelCountdown');
  const cancelTimerSection = document.getElementById('cancelTimerSection');
  const cancelBtn = document.getElementById('cancelOrderBtn');

  if (!countdownElement || !cancelTimerSection) return;

  // Update countdown display
  const updateCountdown = () => {
    if (timeRemaining <= 0) {
      clearInterval(cancellationTimerInterval);
      countdownElement.textContent = '00:00';
      cancelTimerSection.classList.remove('bg-warning', 'bg-opacity-10', 'border-warning');
      cancelTimerSection.classList.add('bg-success', 'bg-opacity-10', 'border-success');
      cancelTimerSection.innerHTML = `
        <h6 class="fw-bold text-success mb-0">
          <i class="bi bi-check-circle-fill me-2"></i>Order Confirmed
        </h6>
        <p class="text-dark small mb-0 mt-2">Your order has been sent to the kitchen and is being prepared.</p>
      `;
      console.log('✅ Cancellation window closed - order sent to kitchen');
      
      // Clear the cart completely when order is confirmed
      clearAllCartData();
      
      return;
    }

    countdownElement.textContent = formatCountdown(timeRemaining);
    timeRemaining -= 1;
  };

  countdownElement.textContent = formatCountdown(timeRemaining);
  timeRemaining -= 1;

  // Start timer
  cancellationTimerInterval = setInterval(updateCountdown, 1000);
  
  // Handle cancel button click
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      await cancelOrderWithConfirmation(orderId);
    });
  }
}

// Cancel order with user confirmation
async function cancelOrderWithConfirmation(orderId) {
  const confirmed = confirm(
    `Are you sure you want to cancel Order #${orderId}?\n\nYour payment will be refunded to your original payment method.`
  );

  if (!confirmed) return;

  try {
    console.log(`🗑️  Sending cancel request for Order #${orderId}`);
    
    const form = new URLSearchParams();
    form.append('action', 'cancel');
    form.append('orderId', orderId);

    const response = await fetch(getOrderApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });

    const data = await response.json();
    console.log('Cancel response:', data);

    if (response.ok && data.status === 'success') {
      // Clear the timer
      clearInterval(cancellationTimerInterval);
      
      // Show success message
      const cancelTimerSection = document.getElementById('cancelTimerSection');
      if (cancelTimerSection) {
        cancelTimerSection.classList.remove('bg-warning', 'bg-opacity-10', 'border-warning');
        cancelTimerSection.classList.add('bg-danger', 'bg-opacity-10', 'border-danger');
        cancelTimerSection.innerHTML = `
          <h6 class="fw-bold text-danger mb-0">
            <i class="bi bi-x-circle-fill me-2"></i>Order Cancelled
          </h6>
          <p class="text-dark small mb-0 mt-2">Order #${orderId} has been cancelled. You will receive a refund within 2-3 business days.</p>
        `;
      }
      
      showNotification(`✅ Order #${orderId} cancelled successfully. Refund initiated.`, 'success');
      console.log(`✅ Order #${orderId} cancelled and deleted from database`);
    } else {
      showNotification(`❌ Failed to cancel order: ${data.message || 'Unknown error'}`, 'error');
      console.error('Cancel failed:', data);
    }
  } catch (err) {
    console.error('❌ Error cancelling order:', err);
    showNotification(`❌ Cannot reach server: ${err.message}`, 'error');
  }
}

async function triggerRefund(paymentId, amount) {
  if (!confirm(`Create refund for payment #${paymentId} of amount ₹${amount}?`)) return;
  try {
    const form = new URLSearchParams();
    form.append('action', 'refund');
    form.append('paymentId', paymentId);
    form.append('amount', amount);
    form.append('reason', 'Manager initiated refund');

    const res = await fetch(getPaymentApiUrl(), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    const data = await res.json();
    const rv = document.getElementById('refundResult');
    if (res.ok && data.status === 'success') {
      if (rv) rv.innerHTML = `<div class="alert alert-success">Refund created: #${data.refundId}</div>`;
      loadPaymentsList();
    } else {
      if (rv) rv.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
    }
  } catch (e) {
    console.error(e);
    const rv = document.getElementById('refundResult');
    if (rv) rv.innerHTML = `<div class="alert alert-danger">Error creating refund</div>`;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Load saved addresses on page load
  loadSavedAddresses();

  // Event listener for saved addresses dropdown
  const addressSelect = document.getElementById('savedAddressSelect');
  if (addressSelect) {
    addressSelect.addEventListener('change', function (e) {
      if (e.target.value) {
        document.getElementById('paymentDetails').value = e.target.value;
      }
    });
  }

  const payBtn = document.getElementById('payBtn');
  if (payBtn) {
    payBtn.addEventListener('click', async function () {
      const user = getActiveUserSession();
      
      if (!user) {
        showNotification('❌ User not authenticated! Please login first.', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
      }

      const userId = user.userId || user.id;

      // Determine orderId passed via querystring (created earlier) or build from cart
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdParam = urlParams.get('orderId');
      let items = [];
      const pendingCart = JSON.parse(localStorage.getItem('pending_cart') || 'null');
      const cart = JSON.parse(localStorage.getItem('canteen_cart') || '[]');
      if (pendingCart && pendingCart.length) items = pendingCart.map(c => ({ name: c.name || 'Item', qty: c.quantity || c.qty || 1, price: c.price || c.unitPrice || 0 }));
      else items = cart.map(c => ({ name: c.name || 'Item', qty: c.quantity || c.qty || 1, price: c.price || c.unitPrice || 0 }));

      // Get delivery address and validate
      const deliveryAddress = document.getElementById('paymentDetails')?.value?.trim() || '';
      const shouldSave = document.getElementById('saveAddressCheckbox')?.checked || false;

      if (!deliveryAddress) {
        showNotification('⚠️ Please enter a delivery address', 'warning');
        return;
      }

      // Save address if checkbox is checked
      if (shouldSave) {
        saveAddressToDatabase(deliveryAddress, userId);
      }

      // Calculate total amount
      const billing = computeBilling(items);
      const totalAmount = billing.total;

      let orderId = null;

      // If orderId from URL, use it directly
      if (orderIdParam) {
        orderId = parseInt(orderIdParam, 10);
        console.log(`📌 Using existing order ID from URL: ${orderId}`);
      } else {
        // Create order on backend first
        showNotification('📝 Creating order...', 'info');
        orderId = await createOrderOnBackend(userId, items, deliveryAddress, totalAmount);
        
        if (!orderId) {
          console.error('❌ Order creation failed - backend returned null or error');
          showNotification('❌ Failed to create order. Please check server logs and try again.', 'error');
          return;
        }
      }

      // Proceed with payment
      const order = { orderId: orderId, items: items };
      document.getElementById('orderSummary').innerHTML = `<pre>${JSON.stringify(billing, null, 2)}</pre>`;
      initPayment(order, deliveryAddress);
    });
  }

  const closeReceipt = document.getElementById('closeReceipt');
  if (closeReceipt) closeReceipt.addEventListener('click', () => document.getElementById('receiptCard').style.display = 'none');

  if (document.getElementById('paymentsTableBody')) {
    loadPaymentsList();
  }
});

// helper to clear pending cart after successful payment
function clearPendingCart() {
  clearAllCartData();
}

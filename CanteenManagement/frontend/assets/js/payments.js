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

function roundCurrency(value) {
  return Number(Math.round((Number(value) || 0) * 100) / 100);
}

function computeBilling(items = []) {
  // items: array of {name, qty, price}
  const subtotal = roundCurrency(items.reduce((s, it) => {
    const qty = Number(it.qty ?? it.quantity ?? 1);
    const price = Number(it.price ?? 0);
    return s + (price * qty);
  }, 0));

  const taxRate = 0.05;
  const serviceRate = 0.02;
  const tax = roundCurrency(subtotal * taxRate);
  const service = roundCurrency(subtotal * serviceRate);
  const discount = 0.00;
  const total = roundCurrency(subtotal + tax + service - discount);

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
      console.log(`✅ Payment initiated with ID: ${data.paymentId}`);
      if (method === 'Cash') {
        showNotification('Cash payment request sent to the POS counter.', 'info');
        pollCashPaymentStatus(data.paymentId, order, deliveryAddress);
      } else {
        showNotification('Payment initiated. Simulating gateway...', 'info');
        // Simulate redirect to gateway and immediate callback success
        setTimeout(() => {
          simulateGatewayCallback(data.paymentId, 'success', order.orderId, deliveryAddress);
        }, 700);
      }
    } else {
      showNotification(data.message || 'Failed to initiate payment', 'error');
    }
  } catch (e) {
    console.error(e);
    showNotification('Cannot reach payment endpoint', 'error');
  }
}

function pollCashPaymentStatus(paymentId, order, deliveryAddress) {
  const poll = async () => {
    try {
      const response = await fetch(getPaymentApiUrl(`?action=paymentStatus&paymentId=${encodeURIComponent(paymentId)}`));
      const data = await response.json();
      if (!response.ok || data.status !== 'success') throw new Error(data.message || 'Unable to read cash payment status');

      if (data.paymentStatus === 'PAID') {
        showNotification('Payment PAID', 'success');
        generateCashReceipt(order, data, deliveryAddress);
        clearPendingCart();
        return;
      }

      if (data.paymentStatus === 'FAILED') {
        await showCashPaymentProblemPopup();
        window.location.href = 'menu.html';
        return;
      }

      setTimeout(poll, 2000);
    } catch (error) {
      console.error('Cash payment status check failed:', error);
      setTimeout(poll, 3000);
    }
  };

  poll();
}

function showCashPaymentProblemPopup() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'cp-confirm-overlay';

    const box = document.createElement('div');
    box.className = 'cp-confirm-box';

    const header = document.createElement('div');
    header.className = 'cp-confirm-header';
    const title = document.createElement('h5');
    title.className = 'cp-confirm-title';
    title.textContent = 'Payment Problem';
    header.appendChild(title);

    const body = document.createElement('div');
    body.className = 'cp-confirm-body';
    body.textContent = 'Your payment is not recieved Please Pay at counter first';

    const actions = document.createElement('div');
    actions.className = 'cp-confirm-actions';
    const okButton = document.createElement('button');
    okButton.type = 'button';
    okButton.className = 'cp-confirm-btn cp-confirm-btn-confirm';
    okButton.textContent = 'OK';
    actions.appendChild(okButton);

    const close = () => {
      overlay.remove();
      resolve();
    };

    okButton.addEventListener('click', close);
    box.append(header, body, actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  });
}

function generateCashReceipt(order, paymentData, deliveryAddress) {
  const pendingCart = JSON.parse(localStorage.getItem('pending_cart') || 'null');
  const cart = JSON.parse(localStorage.getItem('canteen_cart') || '[]');
  const items = pendingCart && pendingCart.length ? pendingCart : cart;
  const receiptOrder = {
    orderId: order.orderId,
    items: items.map(item => ({
      name: item.name || 'Item',
      qty: item.quantity || item.qty || 1,
      price: item.price || item.unitPrice || 0
    }))
  };
  generateProfessionalReceipt(receiptOrder, paymentData, deliveryAddress);
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

      const invoiceData = {
        subtotal: Number(data.subtotal ?? 0),
        tax: Number(data.tax ?? 0),
        serviceCharge: Number(data.serviceCharge ?? 0),
        discount: Number(data.discount ?? 0),
        total: Number(data.total ?? 0),
      };

      // Generate professional receipt
      const order = { orderId: orderId || data.orderId || paymentId, items };
      generateProfessionalReceipt(order, { ...data, ...invoiceData }, deliveryAddress);

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
      const refundAction = String(p.status || '').toUpperCase() === 'FAILED'
        ? ''
        : `<button class="btn btn-sm btn-outline-danger" onclick="triggerRefund(${p.paymentId}, ${p.amount})">Refund</button>`;
      tr.innerHTML = `
        <td>${p.paymentId}</td>
        <td>${p.orderId}</td>
        <td>${p.userName || 'Unknown User'}</td>
        <td>${p.method}</td>
        <td>₹${p.amount}</td>
        <td>${p.status}</td>
        <td>${refundAction}</td>
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

  const hasInvoiceTotals = paymentData && Number.isFinite(Number(paymentData.total));
  const billing = hasInvoiceTotals
    ? {
        subtotal: Number(paymentData.subtotal ?? 0),
        tax: Number(paymentData.tax ?? 0),
        service: Number(paymentData.serviceCharge ?? paymentData.service ?? 0),
        discount: Number(paymentData.discount ?? 0),
        total: Number(paymentData.total ?? 0),
      }
    : computeBilling(order.items);
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
  document.getElementById('receiptSubtotal').textContent = `₹${Number(billing.subtotal || 0).toFixed(2)}`;
  document.getElementById('receiptDiscount').textContent = `-₹${Number(billing.discount || 0).toFixed(2)}`;
  document.getElementById('receiptService').textContent = `₹${Number(billing.service || 0).toFixed(2)}`;
  document.getElementById('receiptTaxes').textContent = `₹${Number(billing.tax || 0).toFixed(2)}`;
  document.getElementById('receiptTotal').textContent = `₹${Number(billing.total || 0).toFixed(2)}`;

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
    localStorage.setItem('canteen_cart', JSON.stringify([]));
    localStorage.setItem('pending_cart', JSON.stringify([]));

    if (typeof cartItems !== 'undefined') {
      cartItems = [];
    }

    const cartBadge = document.getElementById('cart-count') || document.querySelector('.cart-badge') || document.querySelector('[data-cart-count]');
    if (cartBadge) {
      cartBadge.textContent = '0';
      cartBadge.style.display = 'inline-block';
    }

    const allCartModals = document.querySelectorAll('#cartModal, [id*="cart"]');
    allCartModals.forEach(modal => {
      if (modal && modal.style && modal.style.display !== 'none') {
        modal.style.display = 'none';
      }
    });

    if (typeof renderCartModal === 'function') {
      renderCartModal();
    }

    console.log('🧹 Cart cleared successfully: localStorage reset, badge updated, modal closed');
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
  const confirmed = await confirmWithPopup({
    title: 'Cancel Order',
    message: `Are you sure you want to cancel Order #${orderId}? Your payment will be refunded to your original payment method.`,
    confirmText: 'Yes, Cancel',
    cancelText: 'Keep Order',
    danger: true
  });

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
      
      clearAllCartData();
      const showRollbackPage = await confirmWithPopup({
        title: 'Order Cancelled',
        message: 'Your Order Get Cancelled Successfully ',
        confirmText: 'View Payment Rollback',
        cancelText: 'Return to Menu',
        danger: false
      });

      if (showRollbackPage) {
        window.location.href = `payment-rollback.html?orderId=${encodeURIComponent(orderId)}`;
      } else {
        window.location.href = 'menu.html';
      }
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
      initPayment(order, deliveryAddress);
    });
  }

  const goToMenuBtn = document.getElementById('goToMenuBtn');
  if (goToMenuBtn) goToMenuBtn.addEventListener('click', () => window.location.href = 'menu.html');

  const goToHomeBtn = document.getElementById('goToHomeBtn');
  if (goToHomeBtn) goToHomeBtn.addEventListener('click', () => window.location.href = 'index.html');

  const closeReceipt = document.getElementById('closeReceipt');
  if (closeReceipt) closeReceipt.addEventListener('click', () => window.location.href = 'menu.html');

  if (document.getElementById('paymentsTableBody')) {
    loadPaymentsList();
  }
});

// helper to clear pending cart after successful payment
function clearPendingCart() {
  clearAllCartData();
}

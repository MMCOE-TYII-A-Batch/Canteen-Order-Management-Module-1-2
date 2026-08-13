function getPaymentApiUrl(queryString = "") {
  const contextPath = "/canteen";
  if (window.location.origin.startsWith("file:") || window.location.port !== "8080") {
    return `http://localhost:8080${contextPath}/payment${queryString}`;
  }
  return `${window.location.origin}${contextPath}/payment${queryString}`;
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

async function initPayment(order) {
  // order: {orderId, items[]}
  const billing = computeBilling(order.items);
  const method = document.getElementById('paymentMethod')?.value || 'UPI';
  try {
    const form = new URLSearchParams();
    form.append('action', 'initiate');
    form.append('orderId', order.orderId);
    form.append('amount', billing.total);
    form.append('method', method);

    const res = await fetch(getPaymentApiUrl(), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      showNotification('Payment initiated. Simulating gateway...', 'info');
      // Simulate redirect to gateway and immediate callback success
      setTimeout(() => {
        simulateGatewayCallback(data.paymentId, 'success');
      }, 700);
    } else {
      showNotification(data.message || 'Failed to initiate payment', 'error');
    }
  } catch (e) {
    console.error(e);
    showNotification('Cannot reach payment endpoint', 'error');
  }
}

async function simulateGatewayCallback(paymentId, result) {
  try {
    const form = new URLSearchParams();
    form.append('action', 'callback');
    form.append('paymentId', paymentId);
    form.append('result', result);

    const res = await fetch(getPaymentApiUrl(), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() });
    const data = await res.json();
    if (res.ok && data.status === 'success') {
      showNotification('Payment ' + data.paymentStatus, 'success');
      // fetch invoice by order if needed
      // show receipt UI
      const receiptCard = document.getElementById('receiptCard');
      const receiptContent = document.getElementById('receiptContent');
      if (receiptCard && receiptContent) {
        receiptCard.style.display = 'block';
        receiptContent.textContent = JSON.stringify(data, null, 2);
        // clear pending cart upon successful payment
        clearPendingCart();
      }
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
  const payBtn = document.getElementById('payBtn');
  if (payBtn) {
    payBtn.addEventListener('click', function () {
      // Determine orderId passed via querystring (created earlier) or build from cart
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdParam = urlParams.get('orderId');
      let items = [];
      const pendingCart = JSON.parse(localStorage.getItem('pending_cart') || 'null');
      const cart = JSON.parse(localStorage.getItem('canteen_cart') || '[]');
      if (pendingCart && pendingCart.length) items = pendingCart.map(c => ({ name: c.name || 'Item', qty: c.quantity || c.qty || 1, price: c.price || c.unitPrice || 0 }));
      else items = cart.map(c => ({ name: c.name || 'Item', qty: c.quantity || c.qty || 1, price: c.price || c.unitPrice || 0 }));

      if (orderIdParam) {
        const order = { orderId: parseInt(orderIdParam, 10), items };
        document.getElementById('orderSummary').innerHTML = `<pre>${JSON.stringify(computeBilling(order.items), null, 2)}</pre>`;
        initPayment(order);
        return;
      }

      // Fallback: create a temporary order id for demo
      const order = { orderId: Math.floor(Math.random() * 100000) + 5000, items };
      document.getElementById('orderSummary').innerHTML = `<pre>${JSON.stringify(computeBilling(order.items), null, 2)}</pre>`;
      initPayment(order);
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
  try { localStorage.removeItem('pending_cart'); localStorage.removeItem('canteen_cart'); } catch (e) {}
}

import { formatQIEAmount, formatUSD, getQIEPrice } from './currency';
import { EXPLORER_URL } from './constants';

/* ── QIEPay Logo SVG (ring + bolt, emerald gradient) ── */
const LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="170" stroke="url(#lg)" stroke-width="36" fill="none"/>
  <path d="M290 108L175 300H245L220 410L340 220H265L290 108Z" fill="url(#lg)"/>
</svg>`;

const LOGO_DATA_URI = `data:image/svg+xml,${encodeURIComponent(LOGO_SVG)}`;

/**
 * Generate a full professional invoice HTML document
 * @param {Object} payment - Payment object from getPayment
 * @param {string} merchantAddr - Merchant wallet address
 * @returns {string} Complete HTML document string
 */
export function generateInvoiceHTML(payment, merchantAddress) {
  const date = payment.createdAt ? new Date(payment.createdAt * 1000) : new Date();
  const settledDate = payment.settledAt ? new Date(payment.settledAt * 1000) : null;
  const invoiceNumber = `QIE-${payment.id.toString().padStart(6, '0')}`;
  const qiePrice = getQIEPrice();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} - QIEPay</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      background: #f8fafb;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
      box-shadow: 0 0 40px rgba(0,0,0,0.04);
    }

    /* ── Emerald branded header ── */
    .header {
      background: linear-gradient(135deg, #059669 0%, #10B981 40%, #38BDF8 100%);
      color: white;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    .header::after {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .header p { opacity: 0.85; font-size: 14px; }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .brand-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-icon img { width: 100%; height: 100%; }

    .body { padding: 40px; }

    .row { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .col { flex: 1; }
    .col:last-child { text-align: right; }
    .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .value { font-size: 15px; font-weight: 600; color: #0f172a; word-break: break-all; }
    .meta { font-size: 13px; color: #64748b; }

    /* Status badges */
    .status-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-created { background: #fef3c7; color: #92400e; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-settled { background: #d1fae5; color: #065f46; }
    .status-refunded { background: #ffedd5; color: #9a3412; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    /* Items table */
    .items { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .items th {
      text-align: left;
      padding: 12px 16px;
      background: #f1f5f9;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      border-bottom: 2px solid #e2e8f0;
    }
    .items td { padding: 16px; border-bottom: 1px solid #f1f5f9; }
    .items .amount { text-align: right; font-weight: 600; }
    .items .qty { text-align: center; }

    .subtotal-row td { padding: 12px 16px; color: #64748b; font-size: 14px; }
    .fee-row td { padding: 12px 16px; color: #ef4444; font-size: 14px; }
    .total-row { background: #f8fafc; }
    .total-row td { font-weight: 700; font-size: 16px; padding: 16px; }

    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }

    .footer {
      padding: 24px 40px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer a { color: #10B981; text-decoration: none; }

    /* Settlement notice */
    .settled-notice {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
    .settled-notice strong { color: #059669; }

    /* Print styles */
    @media print {
      body { background: white; }
      .container {
        box-shadow: none;
        max-width: 100%;
      }
      .header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @page {
        margin: 0.5cm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div class="brand">
            <div class="brand-icon">
              <img src="${LOGO_DATA_URI}" alt="QIEPay" />
            </div>
            <div>
              <h1>QIEPay Invoice</h1>
              <p>Decentralized Payment Gateway</p>
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:24px; font-weight:700;">${invoiceNumber}</div>
          <div style="opacity:0.85; font-size:13px; margin-top:4px;">${formatDate(date)}</div>
          <div style="margin-top:8px;">
            <span class="status-badge status-${getStatusClass(payment.status)}">${getStatusName(payment.status)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="body">
      <!-- Bill From / Bill To -->
      <div class="row">
        <div class="col">
          <div class="label">Bill From (Merchant)</div>
          <div class="value" style="font-size:13px; font-family:monospace;">${merchantAddress || payment.merchant}</div>
          <div class="meta" style="margin-top:4px;">QIE Testnet</div>
        </div>
        <div class="col">
          <div class="label">Bill To (Customer)</div>
          <div class="value" style="font-size:13px; font-family:monospace;">${
            payment.customer && payment.customer !== '0x0000000000000000000000000000000000000000'
              ? payment.customer
              : 'Pending Payment'
          }</div>
        </div>
      </div>

      <!-- Order ID -->
      ${payment.orderId ? `
      <div class="row" style="margin-bottom:16px;">
        <div class="col">
          <div class="label">Order ID</div>
          <div class="value" style="font-size:14px;">${payment.orderId}</div>
        </div>
      </div>` : ''}

      <!-- Items Table -->
      <table class="items">
        <thead>
          <tr>
            <th>Description</th>
            <th class="qty">Qty</th>
            <th class="amount">Amount (QIE)</th>
            <th class="amount">Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${payment.description || 'Payment'}</td>
            <td class="qty">1</td>
            <td class="amount">${formatQIEAmount(payment.amount)} QIE</td>
            <td class="amount">${formatUSD(payment.amount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="subtotal-row">
            <td colspan="2"></td>
            <td class="amount" style="text-align:right; font-weight:600;">Subtotal</td>
            <td class="amount">${formatQIEAmount(payment.amount)} QIE</td>
          </tr>
          ${payment.fee && parseFloat(payment.fee) > 0 ? `
          <tr class="fee-row">
            <td colspan="2"></td>
            <td class="amount" style="text-align:right;">Platform Fee (2.5%)</td>
            <td class="amount">-${formatQIEAmount(payment.fee)} QIE</td>
          </tr>` : ''}
          <tr class="total-row">
            <td colspan="2"><strong>Total</strong></td>
            <td class="amount" style="text-align:right;">${formatQIEAmount(payment.amount)} QIE</td>
            <td class="amount">${formatUSD(payment.amount)}</td>
          </tr>
        </tfoot>
      </table>

      ${settledDate ? `
      <div class="settled-notice">
        <strong>&#10003; Settled</strong>
        <div class="meta" style="margin-top:4px;">Settlement completed on ${formatDate(settledDate)}</div>
      </div>` : ''}

      <hr class="divider" style="margin:32px 0;">

      <!-- Transaction Details -->
      <div class="meta">
        <p><strong>Payment ID:</strong> ${payment.id}</p>
        <p><strong>Created:</strong> ${formatDate(date)}</p>
        ${settledDate ? `<p><strong>Settled:</strong> ${formatDate(settledDate)}</p>` : ''}
        <p><strong>Network:</strong> QIE Testnet (Chain ID: 1983)</p>
        <p><strong>Contract:</strong> 0xFFC670DA0f40c1602175415abd9CEcd6d6BADD42</p>
        <p><strong>QIE Price:</strong> $${qiePrice.toFixed(2)} USD</p>
      </div>
    </div>

    <div class="footer">
      <p>Powered by <a href="#">QIEPay</a> — Decentralized Payment Gateway on QIE Blockchain</p>
      <p style="margin-top:4px;">This is a computer-generated invoice from the QIEPay smart contract.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Download invoice as an HTML file
 * @param {Object} payment - Payment object
 * @param {string} merchantAddress - Merchant wallet address
 */
export function downloadInvoice(payment, merchantAddress) {
  const html = generateInvoiceHTML(payment, merchantAddress);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `QIEPay-Invoice-${payment.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusName(status) {
  const map = { 0: 'Created', 1: 'Paid', 2: 'Settled', 3: 'Refunded', 4: 'Cancelled' };
  return map[status] || 'Unknown';
}

function getStatusClass(status) {
  const map = { 0: 'created', 1: 'paid', 2: 'settled', 3: 'refunded', 4: 'cancelled' };
  return map[status] || 'created';
}

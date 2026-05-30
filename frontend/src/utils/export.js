import { STATUS_MAP } from './constants';
import { formatQIEAmount, formatUSD } from './currency';

/**
 * Escape CSV field value
 * @param {*} value
 * @returns {string}
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@]/.test(str)) return "'" + str;
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export payments array as CSV file with download trigger
 * Columns: ID, Description, OrderID, Amount QIE, Amount USD, Status, Date, TxHash
 *
 * @param {Array} payments - Array of payment objects
 * @param {string} filename - Base filename (without extension/date)
 */
export function exportPaymentsCSV(payments, filename = 'qie-payments') {
  const headers = [
    'ID',
    'Description',
    'Order ID',
    'Amount QIE',
    'Amount USD',
    'Status',
    'Date',
    'TxHash',
  ];

  const rows = payments.map((p) => [
    p.id,
    escapeCSV(p.description || ''),
    escapeCSV(p.orderId || ''),
    formatQIEAmount(p.amount),
    formatUSD(p.amount),
    STATUS_MAP[p.status] || 'Unknown',
    p.createdAt ? new Date(p.createdAt * 1000).toISOString() : '',
    escapeCSV(p.txHash || ''),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

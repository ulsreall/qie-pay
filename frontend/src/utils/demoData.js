/**
 * Demo data for QIE Pay — shown automatically when no wallet is detected.
 * Hackathon judges can explore the full UI without connecting a wallet.
 *
 * All amounts are in QIE units (matching formatPayment output from contract.js).
 */

export const DEMO_ADDRESS = '0xfD24489ead4Da549E2Cf3E18B5e188Ee31c933A6';

export const DEMO_BALANCE = '115.1941';

export const DEMO_PAYMENTS = [
  {
    id: '1',
    merchant: DEMO_ADDRESS,
    customer: '0x35e3f7b29AE84Dc2B6492f1E9c91f1F40f2Bf140',
    amount: '0.05',
    fee: '0.00125',
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
    settledAt: Math.floor(Date.now() / 1000) - 86400,
    description: 'Espresso',
    orderId: 'ORD-001',
    status: 2,
  },
  {
    id: '2',
    merchant: DEMO_ADDRESS,
    customer: '0x1234AbCd5678EfGh9012IjKl3456MnOp78905678',
    amount: '0.08',
    fee: '0.002',
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    settledAt: 0,
    description: 'Cappuccino + Croissant',
    orderId: 'ORD-002',
    status: 1,
  },
  {
    id: '3',
    merchant: DEMO_ADDRESS,
    customer: '0xabcdef0123456789abcdef0123456789abcdef01',
    amount: '0.12',
    fee: '0.003',
    createdAt: Math.floor(Date.now() / 1000) - 3600,
    settledAt: 0,
    description: 'Avocado Toast',
    orderId: 'ORD-003',
    status: 0,
  },
];

/** Total merchant earnings in QIE (already settled fees + principal) */
export const DEMO_EARNINGS = '0.13';

/** Revenue chart data for the last 7 days (QIE) */
export const DEMO_CHART_DATA = [
  { date: 'May 15', revenue: 0 },
  { date: 'May 16', revenue: 0 },
  { date: 'May 17', revenue: 0 },
  { date: 'May 18', revenue: 0.05 },
  { date: 'May 19', revenue: 0.05 },
  { date: 'May 20', revenue: 0.13 },
  { date: 'May 21', revenue: 0.13 },
];

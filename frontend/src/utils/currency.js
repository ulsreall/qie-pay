import { ethers } from 'ethers';

// QIE/USD price (hardcoded for testnet)
export const QIE_USD_PRICE = 2.50;

/**
 * Convert wei amount to formatted QIE string (4 decimals)
 * @param {string|bigint} weiAmount - Amount in wei
 * @returns {string} Formatted QIE amount
 */
export function formatQIE(weiAmount) {
  if (!weiAmount || weiAmount === '0' || weiAmount === 0n) return '0.0000';
  try {
    const qie = parseFloat(ethers.formatEther(weiAmount.toString()));
    return qie.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  } catch {
    return '0.0000';
  }
}

/**
 * Convert QIE amount to USD display string
 * @param {number|string} qieAmount - Amount in QIE (not wei)
 * @returns {string} Formatted USD string
 */
export function formatUSD(qieAmount) {
  if (!qieAmount) return '$0.00';
  try {
    const amount = typeof qieAmount === 'string' ? parseFloat(qieAmount) : qieAmount;
    const usd = amount * QIE_USD_PRICE;
    return '$' + usd.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return '$0.00';
  }
}

/**
 * Format wei amount as both QIE and USD: "X.XXXX QIE (~$Y.YY)"
 * @param {string|bigint} weiAmount - Amount in wei
 * @returns {string} Combined display string
 */
export function formatBoth(weiAmount) {
  const qie = formatQIE(weiAmount);
  const qieNum = parseFloat(ethers.formatEther(weiAmount.toString()));
  return `${qie} QIE (~${formatUSD(qieNum)})`;
}

/**
 * Parse a QIE amount (human-readable) to wei BigInt
 * @param {number|string} qieAmount - Amount in QIE
 * @returns {bigint} Amount in wei
 */
export function parseQIEtoWei(qieAmount) {
  return ethers.parseEther(qieAmount.toString());
}

/**
 * Format QIE amount for display (from ether units, not wei)
 * Used by existing pages where contract data is already in QIE units
 * @param {number|string} qieAmount - Amount in QIE
 * @returns {string} Formatted display string
 */
export function formatQIEAmount(qieAmount) {
  if (!qieAmount) return '0.00';
  try {
    const amount = typeof qieAmount === 'string' ? parseFloat(qieAmount) : qieAmount;
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  } catch {
    return '0.00';
  }
}

/**
 * Convert QIE to USD (numeric)
 * @param {number|string} qieAmount
 * @returns {number}
 */
export function qieToUSD(qieAmount) {
  const amount = typeof qieAmount === 'string' ? parseFloat(qieAmount) : qieAmount;
  return amount * QIE_USD_PRICE;
}

/**
 * Convert USD to QIE (numeric)
 * @param {number} usdAmount
 * @returns {number}
 */
export function usdToQIE(usdAmount) {
  return usdAmount / QIE_USD_PRICE;
}

/**
 * Get the current QIE/USD price
 * @returns {number}
 */
export function getQIEPrice() {
  return QIE_USD_PRICE;
}

/**
 * Format currency pair display object
 * @param {number|string} qieAmount
 * @returns {{ qie: string, usd: string, display: string }}
 */
export function formatCurrencyPair(qieAmount) {
  const qie = formatQIEAmount(qieAmount);
  const usd = formatUSD(qieAmount);
  return { qie, usd, display: `${qie} QIE (${usd})` };
}

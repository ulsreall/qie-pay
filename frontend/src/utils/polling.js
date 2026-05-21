import { getPayment } from './contract';

/**
 * Poll payment status until it changes from Created (0).
 * @param {string} paymentId - The payment ID to poll
 * @param {function} callback - Called with (payment, statusChanged)
 * @param {number} interval - Poll interval in ms (default 5000)
 * @returns {function} Cleanup function to stop polling
 */
export function pollPaymentStatus(paymentId, callback, interval = 5000) {
  let active = true;
  let timeoutId = null;

  const poll = async () => {
    if (!active) return;

    try {
      const payment = await getPayment(paymentId);
      const statusChanged = payment.status !== 0;

      if (callback) {
        callback(payment, statusChanged);
      }

      if (statusChanged) {
        active = false;
        return;
      }

      if (active) {
        timeoutId = setTimeout(poll, interval);
      }
    } catch (err) {
      console.error('Polling error:', err);
      if (active) {
        timeoutId = setTimeout(poll, interval * 2); // Back off on error
      }
    }
  };

  // Start polling
  poll();

  // Return cleanup function
  return () => {
    active = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Create a payment poller that watches for status changes.
 * Polls getPayment() every intervalMs, calls onStatusChange when status changes,
 * auto-stops when status changes from Created (0).
 *
 * @param {string} paymentId - The payment ID to poll
 * @param {function} onStatusChange - Called with (updatedPayment) when status changes
 * @param {number} intervalMs - Poll interval in ms (default 5000)
 * @returns {{ stop: () => void }} Object with stop() cleanup method
 */
export function createPaymentPoller(paymentId, onStatusChange, intervalMs = 5000) {
  let active = true;
  let timeoutId = null;
  let lastStatus = null;

  const poll = async () => {
    if (!active) return;

    try {
      const payment = await getPayment(paymentId);

      // Track initial status
      if (lastStatus === null) {
        lastStatus = payment.status;
      }

      // Detect status change
      if (payment.status !== lastStatus) {
        lastStatus = payment.status;

        if (onStatusChange) {
          onStatusChange(payment);
        }

        // Auto-stop if status changed from Created
        if (payment.status !== 0) {
          active = false;
          return;
        }
      }

      // Auto-stop if already past Created when we first check
      if (payment.status !== 0) {
        active = false;
        return;
      }

      if (active) {
        timeoutId = setTimeout(poll, intervalMs);
      }
    } catch (err) {
      console.error('Payment poller error:', err);
      if (active) {
        // Exponential backoff on error
        timeoutId = setTimeout(poll, intervalMs * 2);
      }
    }
  };

  // Start polling
  poll();

  // Return stop() cleanup function
  return {
    stop() {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

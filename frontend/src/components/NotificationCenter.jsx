import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CreditCard, CheckCircle, XCircle, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { checkConnection, getMerchantPayments } from '../utils/contract';
import { formatQIEAmount } from '../utils/currency';

const STORAGE_PREFIX = 'notifications_';
const POLL_INTERVAL = 30000; // 30 seconds

// Status labels for notifications
const STATUS_LABELS = {
  0: { text: 'created', icon: CreditCard, color: 'text-sky-400' },
  1: { text: 'paid', icon: CreditCard, color: 'text-amber-400' },
  2: { text: 'settled', icon: CheckCircle, color: 'text-[#34D399]' },
  3: { text: 'refunded', icon: XCircle, color: 'text-amber-400' },
  4: { text: 'cancelled', icon: XCircle, color: 'text-red-400' },
};

function getStorageKey(address) {
  return `${STORAGE_PREFIX}${address?.toLowerCase() || 'unknown'}`;
}

function loadNotifications(address) {
  try {
    const stored = localStorage.getItem(getStorageKey(address));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotifications(address, notifications) {
  try {
    localStorage.setItem(getStorageKey(address), JSON.stringify(notifications));
  } catch {
    // localStorage full or unavailable
  }
}

export default function NotificationCenter({ collapsed = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [address, setAddress] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const pollRef = useRef(null);
  const knownIdsRef = useRef(new Set());
  const dropdownRef = useRef(null);

  // Initialize: get wallet address and load stored notifications
  useEffect(() => {
    const init = async () => {
      try {
        const conn = await checkConnection();
        if (conn) {
          setAddress(conn.address);
          const stored = loadNotifications(conn.address);
          setNotifications(stored);
          knownIdsRef.current = new Set(stored.map((n) => n.paymentId));
        }
      } catch {
        // no wallet
      }
      setLoaded(true);
    };
    init();
  }, []);

  // Poll for new payments
  const pollPayments = useCallback(async () => {
    if (!address) return;
    try {
      const payments = await getMerchantPayments(address);
      const newNotifications = [];

      for (const payment of payments) {
        if (!knownIdsRef.current.has(payment.id)) {
          knownIdsRef.current.add(payment.id);
          const statusInfo = STATUS_LABELS[payment.status] || STATUS_LABELS[0];
          const notif = {
            id: `${payment.id}-${payment.status}-${Date.now()}`,
            paymentId: payment.id,
            type: payment.status,
            text: `${statusInfo.text} ${formatQIEAmount(payment.amount)} QIE`,
            timestamp: Date.now(),
            read: false,
          };
          newNotifications.push(notif);
        }
      }

      if (newNotifications.length > 0) {
        setNotifications((prev) => {
          const updated = [...newNotifications, ...prev].slice(0, 50); // Keep max 50
          saveNotifications(address, updated);
          return updated;
        });

        // Toast for new payments
        for (const notif of newNotifications) {
          if (notif.type === 1 || notif.type === 0) {
            toast.success('New payment received!', { icon: '💰', duration: 4000 });
          }
        }
      }
    } catch (err) {
      console.error('Notification poll error:', err);
    }
  }, [address]);

  // Start polling
  useEffect(() => {
    if (!address || !loaded) return;

    // Initial poll
    pollPayments();

    pollRef.current = setInterval(pollPayments, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [address, loaded, pollPayments]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(address, updated);
      return updated;
    });
  };

  const markAsRead = (notifId) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notifId ? { ...n, read: true } : n));
      saveNotifications(address, updated);
      return updated;
    });
  };

  const relativeTime = (ts) => {
    try {
      return formatDistanceToNow(new Date(ts), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getNotifIcon = (type) => {
    const info = STATUS_LABELS[type] || STATUS_LABELS[0];
    const Icon = info.icon;
    return <Icon size={14} className={info.color} />;
  };

  // Don't render if no wallet connected
  if (!loaded || !address) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-[#111113] transition-colors duration-150"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full tabular-nums">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-1 max-h-80 overflow-y-auto bg-[#111113] border border-[#27272A] rounded-lg shadow-lg z-50 ${
              collapsed ? 'left-1/2 -translate-x-1/2 w-56' : 'right-0 w-60'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A]">
              <span className="text-sm font-semibold text-[#FAFAFA] tracking-tight">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-[#10B981] hover:text-[#34D399] transition-colors"
                >
                  <Check size={12} />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification list */}
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="text-[#27272A] mx-auto mb-2" />
                <p className="text-xs text-[#71717A]">No notifications yet</p>
                <p className="text-[11px] text-[#52525B] mt-0.5">Payments will appear here</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    to={`/pay/${notif.paymentId}`}
                    onClick={() => {
                      markAsRead(notif.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-[#18181B] transition-colors ${
                      !notif.read ? 'bg-[#10B981]/[0.03]' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className={`text-xs leading-relaxed truncate ${!notif.read ? 'text-[#FAFAFA] font-medium' : 'text-[#A1A1AA]'}`}>
                        {notif.text}
                      </p>
                      <p className="text-[11px] text-[#52525B] mt-0.5">
                        {relativeTime(notif.timestamp)}
                      </p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 mt-1.5" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

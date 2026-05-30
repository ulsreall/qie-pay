/**
 * DemoContext — provides demo data when no wallet is connected.
 *
 * This enables hackathon judges to explore the full QIE Pay experience
 * without needing to install or connect a wallet. Demo mode activates
 * automatically; a real wallet connection overrides it completely.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { checkConnection, onAccountChange } from '../utils/contract';
import {
  DEMO_ADDRESS,
  DEMO_BALANCE,
  DEMO_PAYMENTS,
  DEMO_EARNINGS,
  DEMO_CHART_DATA,
} from '../utils/demoData';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  /* ─── Detect existing wallet on mount ─── */
  useEffect(() => {
    checkConnection().then((conn) => {
      if (conn) {
        setWalletConnected(true);
        setWalletAddress(conn.address);
      }
    }).catch(() => {});

    const handleAccounts = (accounts) => {
      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      } else {
        setWalletConnected(false);
        setWalletAddress(null);
      }
    };

    const cleanup = onAccountChange(handleAccounts);

    // Listen for email wallet creation
    const handleEmailWallet = (e) => {
      if (e.detail && e.detail.address) {
        setWalletConnected(true);
        setWalletAddress(e.detail.address);
      }
    };
    window.addEventListener('qiepay-email-wallet-created', handleEmailWallet);
    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('qiepay-email-wallet-created', handleEmailWallet);
    };
  }, []);

  /* Called by WalletConnect when a real wallet is connected */
  const setConnected = useCallback((address) => {
    setWalletConnected(true);
    setWalletAddress(address);
  }, []);

  const setDisconnected = useCallback(() => {
    setWalletConnected(false);
    setWalletAddress(null);
  }, []);

  const isDemo = !walletConnected;

  const value = useMemo(() => ({
    isDemo,
    walletConnected,
    walletAddress,
    /* Demo-mode data — only used when isDemo === true */
    demoAddress: DEMO_ADDRESS,
    demoPayments: DEMO_PAYMENTS,
    demoEarnings: DEMO_EARNINGS,
    demoBalance: DEMO_BALANCE,
    demoChartData: DEMO_CHART_DATA,
    /* Methods for WalletConnect to call */
    setConnected,
    setDisconnected,
  }), [isDemo, walletConnected, walletAddress, setConnected, setDisconnected]);

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

/**
 * Hook to access demo mode state.
 * Returns { isDemo, demoAddress, demoPayments, demoEarnings, demoBalance, demoChartData, setConnected, setDisconnected }
 */
export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    // Safe fallback if used outside provider (e.g. standalone pages like /pay/:id)
    return {
      isDemo: false,
      walletConnected: false,
      walletAddress: null,
      demoAddress: DEMO_ADDRESS,
      demoPayments: DEMO_PAYMENTS,
      demoEarnings: DEMO_EARNINGS,
      demoBalance: DEMO_BALANCE,
      demoChartData: DEMO_CHART_DATA,
      setConnected: () => {},
      setDisconnected: () => {},
    };
  }
  return ctx;
}

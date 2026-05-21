import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'qiepay_email_wallet';
const DEMO_EMAIL = 'demo@qiepay.io';

/* ─── Email-based wallet context ─── */
const EmailWalletContext = createContext(null);

export function useEmailWallet() {
  return useContext(EmailWalletContext);
}

/* ─── Generate deterministic wallet from email ─── */
function generateWalletFromEmail(email) {
  // Use email as seed to generate deterministic wallet
  // In production, this would use a proper KDF like PBKDF2
  const seed = ethers.id(email + 'qiepay-salt-2026');
  const wallet = new ethers.Wallet(seed);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    email: email,
  };
}

/* ─── Email Wallet Provider ─── */
export function EmailWalletProvider({ children }) {
  const [emailWallet, setEmailWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load saved wallet on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setEmailWallet(data);
      }
    } catch {}
  }, []);

  const connectWithEmail = useCallback(async (email) => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return null;
    }

    setIsConnecting(true);
    try {
      // Simulate network delay for UX
      await new Promise(r => setTimeout(r, 800));

      const wallet = generateWalletFromEmail(email);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
      setEmailWallet(wallet);
      // Notify other contexts (DemoContext, WalletConnect) about new wallet
      window.dispatchEvent(new CustomEvent('qiepay-email-wallet-created', { detail: wallet }));
      toast.success(`Wallet created for ${email}`);
      return wallet;
    } catch (err) {
      toast.error('Failed to create wallet');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectEmail = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEmailWallet(null);
    toast('Email wallet disconnected', { icon: '📧' });
  }, []);

  const value = {
    emailWallet,
    isConnecting,
    connectWithEmail,
    disconnectEmail,
    hasEmailWallet: !!emailWallet,
  };

  return (
    <EmailWalletContext.Provider value={value}>
      {children}
    </EmailWalletContext.Provider>
  );
}

/* ─── Email Login Button Component ─── */
export function EmailLoginButton({ onConnect, compact = false }) {
  const [email, setEmail] = useState('');
  const [showInput, setShowInput] = useState(false);
  const { connectWithEmail, isConnecting } = useEmailWallet();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const wallet = await connectWithEmail(email);
    if (wallet && onConnect) {
      onConnect(wallet);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] text-[#A1A1AA] text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            Continue with Email
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowInput(false)}
                className="flex-1 px-3 py-1.5 border border-[#27272A] text-[#A1A1AA] text-xs rounded-md hover:border-[#3F3F46] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isConnecting || !email}
                className="flex-1 px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs rounded-md transition-colors disabled:opacity-50"
              >
                {isConnecting ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // Full version for landing page
  return (
    <div className="space-y-3">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] text-[#FAFAFA] font-medium transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          Continue with Email
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to create wallet"
              className="w-full pl-10 pr-4 py-3 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowInput(false)}
              className="flex-1 px-4 py-2.5 border border-[#27272A] text-[#A1A1AA] text-sm rounded-lg hover:border-[#3F3F46] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isConnecting || !email}
              className="flex-1 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Wallet'
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#52525B] text-center">
            A wallet will be created deterministically from your email
          </p>
        </form>
      )}
    </div>
  );
}

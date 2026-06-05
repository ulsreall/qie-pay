import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { setCachedEmailWallet, clearCachedEmailWallet } from './contract';

const STORAGE_KEY = 'qiepay_email_wallet';
const DEMO_EMAIL = 'demo@qiepay.io';
const ENCRYPTION_ITERATIONS = 100000; // PBKDF2 iterations

/* ─── Email-based wallet context ─── */
const EmailWalletContext = createContext(null);

export function useEmailWallet() {
  return useContext(EmailWalletContext);
}

/* ─── Encryption Helpers (Web Crypto API) ─── */

/**
 * Derive AES-256-GCM key from email using PBKDF2
 */
async function deriveKey(email, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(email),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: ENCRYPTION_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt private key using AES-256-GCM
 * Returns: { iv: base64, data: base64, salt: string }
 */
async function encryptPrivateKey(privateKey, email) {
  const salt = 'qiepay-encryption-salt-v2-2026';
  const key = await deriveKey(email, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(privateKey)
  );

  // Convert to base64 for storage
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const dataBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

  return { iv: ivBase64, data: dataBase64, salt };
}

/**
 * Decrypt private key using AES-256-GCM
 */
async function decryptPrivateKey(encryptedData, email) {
  const { iv, data, salt } = encryptedData;
  const key = await deriveKey(email, salt);

  // Convert from base64
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const dataBytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    dataBytes
  );

  return new TextDecoder().decode(decrypted);
}

/* ─── Generate deterministic wallet from email ─── */
function generateWalletFromEmail(email) {
  const seed = ethers.id(email + 'qiepay-security-salt-v2-do-not-share-2026-production');
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

  // Load saved wallet on mount (decrypt private key)
  useEffect(() => {
    async function loadWallet() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);

          // Handle legacy unencrypted wallets — migrate on first load
          if (data.privateKey && !data.encrypted) {
            console.warn('Migrating unencrypted wallet to encrypted storage...');
            const encrypted = await encryptPrivateKey(data.privateKey, data.email);
            const migrated = {
              address: data.address,
              email: data.email,
              encrypted: true,
              encryptedKey: encrypted,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            setEmailWallet({
              address: migrated.address,
              email: migrated.email,
              _privateKey: data.privateKey,
            });
            setCachedEmailWallet(data.privateKey, data.address);
            return;
          }

          // Decrypt stored private key
          if (data.encrypted && data.encryptedKey) {
            const privateKey = await decryptPrivateKey(data.encryptedKey, data.email);
            setEmailWallet({
              address: data.address,
              email: data.email,
              _privateKey: privateKey,
            });
            setCachedEmailWallet(privateKey, data.address);
          }
        }
      } catch (err) {
        console.error('Failed to load email wallet:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    loadWallet();
  }, []);

  const connectWithEmail = useCallback(async (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return null;
    }

    setIsConnecting(true);
    try {
      // Simulate network delay for UX
      await new Promise(r => setTimeout(r, 800));

      const wallet = generateWalletFromEmail(email);

      // Encrypt private key before storing
      const encrypted = await encryptPrivateKey(wallet.privateKey, email);
      const storedData = {
        address: wallet.address,
        email: wallet.email,
        encrypted: true,
        encryptedKey: encrypted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

      // Keep private key in memory only (never in localStorage unencrypted)
      setEmailWallet({
        address: wallet.address,
        email: wallet.email,
        _privateKey: wallet.privateKey,
      });
      setCachedEmailWallet(wallet.privateKey, wallet.address);

      // Notify other contexts (DemoContext, WalletConnect) about new wallet
      // SECURITY: Only dispatch address and email — never broadcast privateKey
      window.dispatchEvent(new CustomEvent('qiepay-email-wallet-created', {
        detail: { address: wallet.address, email: wallet.email }
      }));

      toast.success(`Wallet created for ${email}`);

      // Auto-drip testnet QIE from faucet (fire-and-forget)
      fetch('/api/faucet/drip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: wallet.address }),
      }).then(r => r.json()).then(data => {
        if (data.success) {
          toast.success(`+${data.amount} QIE from faucet! 🎉`, { duration: 4000 });
        }
      }).catch(() => {}); // silent fail — wallet still works

      return wallet;
    } catch (err) {
      toast.error('Failed to create wallet');
      console.error('Wallet creation error:', err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectEmail = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearCachedEmailWallet();
    setEmailWallet(null);
    toast('Email wallet disconnected', { icon: '📧' });
  }, []);

  // Get private key (only available in memory, never from localStorage)
  const getPrivateKey = useCallback(() => {
    if (emailWallet && emailWallet._privateKey) {
      return emailWallet._privateKey;
    }
    return null;
  }, [emailWallet]);

  const value = {
    emailWallet: emailWallet ? {
      address: emailWallet.address,
      email: emailWallet.email,
    } : null,
    isConnecting,
    connectWithEmail,
    disconnectEmail,
    getPrivateKey,
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

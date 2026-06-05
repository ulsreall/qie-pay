import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { setCachedEmailWallet, clearCachedEmailWallet } from './contract';

const STORAGE_KEY = 'qiepay_email_wallet';
const DEMO_EMAIL = 'demo@qiepay.io';
const ENCRYPTION_ITERATIONS = 100000; // PBKDF2 iterations
const MIN_PASSWORD_LENGTH = 8;

/* ─── Email-based wallet context ─── */
const EmailWalletContext = createContext(null);

export function useEmailWallet() {
  return useContext(EmailWalletContext);
}

/* ─── Encryption Helpers (Web Crypto API) ─── */

/**
 * Derive AES-256-GCM key from email+password using PBKDF2
 */
async function deriveKey(email, password, salt) {
  const encoder = new TextEncoder();
  // Combine email + password for key derivation
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`${email}:${password}`),
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
 * Hash password for storage (to verify on reconnect without storing plaintext)
 */
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: ENCRYPTION_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

/**
 * Encrypt private key using AES-256-GCM
 * Returns: { iv: base64, data: base64, salt: string }
 */
async function encryptPrivateKey(privateKey, email, password) {
  const salt = 'qiepay-encryption-salt-v2-2026';
  const key = await deriveKey(email, password, salt);
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
async function decryptPrivateKey(encryptedData, email, password) {
  const { iv, data, salt } = encryptedData;
  const key = await deriveKey(email, password, salt);

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

/* ─── Generate deterministic wallet from email + password ─── */
function generateWalletFromEmail(email, password) {
  // SECURITY: password is part of the seed — without it, wallet can't be regenerated
  const seed = ethers.id(`${email}:${password}:qiepay-security-salt-v2-do-not-share-2026-production`);
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
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);

  // Load saved wallet on mount — if encrypted, prompt for password
  useEffect(() => {
    async function loadWallet() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);

          // Handle legacy unencrypted wallets — require password migration
          if (data.privateKey && !data.encrypted) {
            console.warn('Legacy wallet detected — needs password migration');
            // Don't auto-load legacy wallets anymore — force re-register with password
            localStorage.removeItem(STORAGE_KEY);
            toast('Please re-register with a password for security', {
              icon: '🔒',
              duration: 6000,
            });
            return;
          }

          // Encrypted wallet — need password to decrypt
          if (data.encrypted && data.encryptedKey) {
            // Show password prompt
            setNeedsPassword(true);
            setPendingEmail(data.email);
          }
        }
      } catch (err) {
        console.error('Failed to load email wallet:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    loadWallet();
  }, []);

  /**
   * Unlock wallet with password (called from password prompt)
   */
  const unlockWallet = useCallback(async (password) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      const data = JSON.parse(saved);
      if (!data.encrypted || !data.encryptedKey) return false;

      // Verify password hash
      const passwordHash = await hashPassword(password, 'qiepay-password-verify-salt');
      if (data.passwordHash && data.passwordHash !== passwordHash) {
        toast.error('Wrong password');
        return false;
      }

      // Decrypt private key
      const privateKey = await decryptPrivateKey(data.encryptedKey, data.email, password);

      setEmailWallet({
        address: data.address,
        email: data.email,
        _privateKey: privateKey,
        _password: password, // Keep in memory for export feature
      });
      setCachedEmailWallet(privateKey, data.address);
      setNeedsPassword(false);
      setPendingEmail(null);

      return true;
    } catch (err) {
      console.error('Unlock error:', err);
      toast.error('Wrong password or corrupted wallet');
      return false;
    }
  }, []);

  const connectWithEmail = useCallback(async (email, password) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return null;
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return null;
    }

    setIsConnecting(true);
    try {
      // Simulate network delay for UX
      await new Promise(r => setTimeout(r, 800));

      const wallet = generateWalletFromEmail(email, password);

      // Encrypt private key with email+password
      const encrypted = await encryptPrivateKey(wallet.privateKey, email, password);

      // Hash password for verification on reconnect
      const passwordHash = await hashPassword(password, 'qiepay-password-verify-salt');

      const storedData = {
        address: wallet.address,
        email: wallet.email,
        encrypted: true,
        encryptedKey: encrypted,
        passwordHash: passwordHash,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

      // Keep private key and password in memory only
      setEmailWallet({
        address: wallet.address,
        email: wallet.email,
        _privateKey: wallet.privateKey,
        _password: password,
      });
      setCachedEmailWallet(wallet.privateKey, wallet.address);

      // Notify other contexts
      window.dispatchEvent(new CustomEvent('qiepay-email-wallet-created', {
        detail: { address: wallet.address, email: wallet.email }
      }));

      toast.success(`Wallet created for ${email}`);

      // Faucet claim is manual — user goes to /faucet page to claim

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
    setNeedsPassword(false);
    setPendingEmail(null);
    toast('Email wallet disconnected', { icon: '📧' });
  }, []);

  // Get private key (only available in memory, never from localStorage)
  const getPrivateKey = useCallback(() => {
    if (emailWallet && emailWallet._privateKey) {
      return emailWallet._privateKey;
    }
    return null;
  }, [emailWallet]);

  // Get password (only available in memory, for export feature)
  const getPassword = useCallback(() => {
    if (emailWallet && emailWallet._password) {
      return emailWallet._password;
    }
    return null;
  }, [emailWallet]);

  const value = {
    emailWallet: emailWallet ? {
      address: emailWallet.address,
      email: emailWallet.email,
    } : null,
    isConnecting,
    needsPassword,
    pendingEmail,
    connectWithEmail,
    disconnectEmail,
    unlockWallet,
    getPrivateKey,
    getPassword,
    hasEmailWallet: !!emailWallet,
  };

  return (
    <EmailWalletContext.Provider value={value}>
      {children}
    </EmailWalletContext.Provider>
  );
}

/* ─── Password Prompt Component ─── */
export function PasswordPrompt({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { unlockWallet, pendingEmail, disconnectEmail } = useEmailWallet();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    const success = await unlockWallet(password);
    setLoading(false);

    if (success && onUnlock) {
      onUnlock();
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center mb-2">
        <p className="text-sm text-[#A1A1AA]">Enter password to unlock wallet</p>
        {pendingEmail && (
          <p className="text-xs text-[#52525B] mt-1">{pendingEmail}</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full pl-10 pr-4 py-3 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              disconnectEmail();
              toast('Wallet removed. Register again if needed.', { icon: '🗑️' });
            }}
            className="flex-1 px-4 py-2.5 border border-[#27272A] text-[#A1A1AA] text-sm rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading || !password}
            className="flex-1 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Email Login Button Component ─── */
export function EmailLoginButton({ onConnect, compact = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [step, setStep] = useState(1); // 1=email, 2=password
  const { connectWithEmail, isConnecting } = useEmailWallet();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setStep(2);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const wallet = await connectWithEmail(email, password);
    if (wallet && onConnect) {
      onConnect(wallet);
    }
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStep(1);
    setShowInput(false);
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
        ) : step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-2">
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
                onClick={handleReset}
                className="flex-1 px-3 py-1.5 border border-[#27272A] text-[#A1A1AA] text-xs rounded-md hover:border-[#3F3F46] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!email}
                className="flex-1 px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs rounded-md transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-2">
            <p className="text-xs text-[#52525B]">Set a password for <span className="text-[#A1A1AA]">{email}</span></p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
              autoFocus
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-3 py-1.5 border border-[#27272A] text-[#A1A1AA] text-xs rounded-md hover:border-[#3F3F46] transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isConnecting || !password || password !== confirmPassword}
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
      ) : step === 1 ? (
        <form onSubmit={handleEmailSubmit} className="space-y-3">
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
              onClick={handleReset}
              className="flex-1 px-4 py-2.5 border border-[#27272A] text-[#A1A1AA] text-sm rounded-lg hover:border-[#3F3F46] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!email}
              className="flex-1 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <p className="text-[11px] text-[#52525B] text-center">
            You'll set a password to secure your wallet
          </p>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div className="text-center mb-1">
            <p className="text-sm text-[#A1A1AA]">Set a password for</p>
            <p className="text-xs text-[#10B981] font-mono">{email}</p>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              className="w-full pl-10 pr-4 py-3 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
              autoFocus
            />
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full pl-10 pr-4 py-3 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
            />
          </div>
          {password && password.length < MIN_PASSWORD_LENGTH && (
            <p className="text-xs text-amber-400">Password must be at least {MIN_PASSWORD_LENGTH} characters</p>
          )}
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-400">Passwords do not match</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep(1); setPassword(''); setConfirmPassword(''); }}
              className="flex-1 px-4 py-2.5 border border-[#27272A] text-[#A1A1AA] text-sm rounded-lg hover:border-[#3F3F46] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isConnecting || !password || password.length < MIN_PASSWORD_LENGTH || password !== confirmPassword}
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
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-[11px] text-amber-400 flex items-start gap-1.5">
              <span className="mt-0.5">⚠️</span>
              <span><strong>Remember your password!</strong> It's required to access your wallet. There's no password recovery — without it, your wallet cannot be unlocked.</span>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

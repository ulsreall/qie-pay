import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Copy, Check, AlertTriangle, Download, Shield, Key, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmailWallet } from '../utils/email-wallet';

/**
 * ExportWallet — Shows private key and recovery info
 * Requires password confirmation before revealing sensitive data
 */
export default function ExportWallet() {
  const { getPrivateKey, getPassword, hasEmailWallet, emailWallet } = useEmailWallet();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);

  if (!hasEmailWallet) {
    return (
      <div className="bg-[#111113] border border-[#27272A] rounded-xl p-6">
        <p className="text-[#A1A1AA] text-sm text-center">
          No email wallet connected. Create one first.
        </p>
      </div>
    );
  }

  const handleVerify = () => {
    const storedPassword = getPassword();
    if (storedPassword && passwordInput === storedPassword) {
      setVerified(true);
      const pk = getPrivateKey();
      setPrivateKey(pk);
      toast.success('Password verified');
    } else {
      toast.error('Wrong password');
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExportJSON = () => {
    if (!privateKey || !emailWallet) return;

    const exportData = {
      version: '1.0',
      wallet: 'QIEPay Email Wallet',
      address: emailWallet.address,
      email: emailWallet.email,
      privateKey: privateKey,
      network: 'QIE Testnet',
      chainId: 1983,
      exportedAt: new Date().toISOString(),
      warning: 'KEEP THIS FILE SECURE. Anyone with this private key can access your funds.',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qiepay-wallet-${emailWallet.address.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Wallet exported!');
  };

  const maskKey = (key) => {
    if (!key) return '';
    return key.slice(0, 6) + '•'.repeat(58) + key.slice(-4);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Key className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-[#FAFAFA] font-medium">Export Wallet</h3>
          <p className="text-xs text-[#52525B]">View private key and recovery info</p>
        </div>
      </div>

      {/* Password Verification Gate */}
      {!verified ? (
        <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-[#A1A1AA]">
            <Lock className="w-4 h-4" />
            <p className="text-sm">Enter your password to continue</p>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter wallet password"
              className="flex-1 px-3 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            <button
              onClick={handleVerify}
              disabled={!passwordInput}
              className="px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Verify
            </button>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          {/* Security Warning */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          >
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-400">Security Warning</p>
                <ul className="text-xs text-red-300/80 space-y-1">
                  <li>• Never share your private key with anyone</li>
                  <li>• Never paste it into any website or app</li>
                  <li>• Store it in a secure password manager</li>
                  <li>• Anyone with this key can steal your funds</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Private Key Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#10B981]" />
                <h4 className="text-sm font-medium text-[#FAFAFA]">Private Key</h4>
              </div>
              <button
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
              >
                {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPrivateKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
              <p className="font-mono text-xs text-[#A1A1AA] break-all leading-relaxed">
                {showPrivateKey ? privateKey : maskKey(privateKey)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(privateKey, 'Private Key')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1A1A1C] border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-xs text-[#A1A1AA] transition-colors"
              >
                {copied === 'Private Key' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'Private Key' ? 'Copied!' : 'Copy Key'}
              </button>
              <button
                onClick={handleExportJSON}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1A1A1C] border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-xs text-[#A1A1AA] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </motion.div>

          {/* Recovery Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-3"
          >
            <button
              onClick={() => setShowRecovery(!showRecovery)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-medium text-[#FAFAFA]">Recovery Information</h4>
              </div>
              <span className="text-xs text-[#52525B]">{showRecovery ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {showRecovery && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-xs text-amber-400">
                      Your wallet is derived from your <strong>email + password</strong>. To recover your wallet on another device, you need both.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
                      <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Email</p>
                      <p className="text-sm text-[#FAFAFA] font-mono">{emailWallet?.email}</p>
                    </div>

                    <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
                      <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Wallet Address</p>
                      <p className="text-sm text-[#FAFAFA] font-mono break-all">{emailWallet?.address}</p>
                    </div>

                    <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-3">
                      <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Recovery Method</p>
                      <p className="text-sm text-[#A1A1AA]">
                        Use <strong className="text-[#FAFAFA]">email + password</strong> on any QIEPay instance to restore your wallet
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const recoveryText = `QIEPay Wallet Recovery\nEmail: ${emailWallet?.email}\nAddress: ${emailWallet?.address}\nNetwork: QIE Testnet (Chain ID 1983)\n\nTo recover: Login with your email and password on QIEPay.`;
                      handleCopy(recoveryText, 'Recovery Info');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1A1A1C] border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-xs text-[#A1A1AA] transition-colors"
                  >
                    {copied === 'Recovery Info' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'Recovery Info' ? 'Copied!' : 'Copy Recovery Info'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

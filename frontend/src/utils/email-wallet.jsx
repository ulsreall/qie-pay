     1|import { useState, useEffect, useCallback, createContext, useContext } from 'react';
     2|import { ethers } from 'ethers';
     3|import toast from 'react-hot-toast';
     4|
     5|const STORAGE_KEY = 'qiepay_email_wallet';
     6|const DEMO_EMAIL = 'demo@qiepay.io';
     7|
     8|/* ─── Email-based wallet context ─── */
     9|const EmailWalletContext = createContext(null);
    10|
    11|export function useEmailWallet() {
    12|  return useContext(EmailWalletContext);
    13|}
    14|
    15|/* ─── Generate deterministic wallet from email ─── */
    16|function generateWalletFromEmail(email) {
    17|  // Use email as seed to generate deterministic wallet
    18|  // In production, this would use a proper KDF like PBKDF2
    19|  const seed = ethers.id(email + 'qiepay-salt-2026');
    20|  const wallet = new ethers.Wallet(seed);
    21|  return {
    22|    address: wallet.address,
    23|    privateKey: wallet.privateKey,
    24|    email: email,
    25|  };
    26|}
    27|
    28|/* ─── Email Wallet Provider ─── */
    29|export function EmailWalletProvider({ children }) {
    30|  const [emailWallet, setEmailWallet] = useState(null);
    31|  const [isConnecting, setIsConnecting] = useState(false);
    32|
    33|  // Load saved wallet on mount
    34|  useEffect(() => {
    35|    try {
    36|      const saved = localStorage.getItem(STORAGE_KEY);
    37|      if (saved) {
    38|        const data = JSON.parse(saved);
    39|        setEmailWallet(data);
    40|      }
    41|    } catch {}
    42|  }, []);
    43|
    44|  const connectWithEmail = useCallback(async (email) => {
    45|    if (!email || !email.includes('@')) {
    46|      toast.error('Please enter a valid email');
    47|      return null;
    48|    }
    49|
    50|    setIsConnecting(true);
    51|    try {
    52|      // Simulate network delay for UX
    53|      await new Promise(r => setTimeout(r, 800));
    54|
    55|      const wallet = generateWalletFromEmail(email);
    56|      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    57|      setEmailWallet(wallet);
    58|      // Notify other contexts (DemoContext, WalletConnect) about new wallet
    59|      window.dispatchEvent(new CustomEvent('qiepay-email-wallet-created', { detail: wallet }));
    60|      toast.success(`Wallet created for ${email}`);
    61|
    62|      // Auto-drip testnet QIE from faucet (fire-and-forget)
    63|      fetch('/api/faucet/drip', {
    64|        method: 'POST',
    65|        headers: { 'Content-Type': 'application/json' },
    66|        body: JSON.stringify({ address: wallet.address }),
    67|      }).then(r => r.json()).then(data => {
    68|        if (data.success) {
    69|          toast.success(`+${data.amount} QIE from faucet! 🎉`, { duration: 4000 });
    70|        }
    71|      }).catch(() => {}); // silent fail — wallet still works
    72|
    73|      return wallet;
    74|    } catch (err) {
    75|      toast.error('Failed to create wallet');
    76|      return null;
    77|    } finally {
    78|      setIsConnecting(false);
    79|    }
    80|  }, []);
    81|
    82|  const disconnectEmail = useCallback(() => {
    83|    localStorage.removeItem(STORAGE_KEY);
    84|    setEmailWallet(null);
    85|    toast('Email wallet disconnected', { icon: '📧' });
    86|  }, []);
    87|
    88|  const value = {
    89|    emailWallet,
    90|    isConnecting,
    91|    connectWithEmail,
    92|    disconnectEmail,
    93|    hasEmailWallet: !!emailWallet,
    94|  };
    95|
    96|  return (
    97|    <EmailWalletContext.Provider value={value}>
    98|      {children}
    99|    </EmailWalletContext.Provider>
   100|  );
   101|}
   102|
   103|/* ─── Email Login Button Component ─── */
   104|export function EmailLoginButton({ onConnect, compact = false }) {
   105|  const [email, setEmail] = useState('');
   106|  const [showInput, setShowInput] = useState(false);
   107|  const { connectWithEmail, isConnecting } = useEmailWallet();
   108|
   109|  const handleSubmit = async (e) => {
   110|    e.preventDefault();
   111|    const wallet = await connectWithEmail(email);
   112|    if (wallet && onConnect) {
   113|      onConnect(wallet);
   114|    }
   115|  };
   116|
   117|  if (compact) {
   118|    return (
   119|      <div className="space-y-2">
   120|        {!showInput ? (
   121|          <button
   122|            onClick={() => setShowInput(true)}
   123|            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] text-[#A1A1AA] text-sm transition-colors"
   124|          >
   125|            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
   126|              <rect x="2" y="4" width="20" height="16" rx="2"/>
   127|              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
   128|            </svg>
   129|            Continue with Email
   130|          </button>
   131|        ) : (
   132|          <form onSubmit={handleSubmit} className="space-y-2">
   133|            <input
   134|              type="email"
   135|              value={email}
   136|              onChange={(e) => setEmail(e.target.value)}
   137|              placeholder="Enter your email"
   138|              className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
   139|              autoFocus
   140|            />
   141|            <div className="flex gap-2">
   142|              <button
   143|                type="button"
   144|                onClick={() => setShowInput(false)}
   145|                className="flex-1 px-3 py-1.5 border border-[#27272A] text-[#A1A1AA] text-xs rounded-md hover:border-[#3F3F46] transition-colors"
   146|              >
   147|                Cancel
   148|              </button>
   149|              <button
   150|                type="submit"
   151|                disabled={isConnecting || !email}
   152|                className="flex-1 px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs rounded-md transition-colors disabled:opacity-50"
   153|              >
   154|                {isConnecting ? 'Creating...' : 'Create Wallet'}
   155|              </button>
   156|            </div>
   157|          </form>
   158|        )}
   159|      </div>
   160|    );
   161|  }
   162|
   163|  // Full version for landing page
   164|  return (
   165|    <div className="space-y-3">
   166|      {!showInput ? (
   167|        <button
   168|          onClick={() => setShowInput(true)}
   169|          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] text-[#FAFAFA] font-medium transition-colors"
   170|        >
   171|          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
   172|            <rect x="2" y="4" width="20" height="16" rx="2"/>
   173|            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
   174|          </svg>
   175|          Continue with Email
   176|        </button>
   177|      ) : (
   178|        <form onSubmit={handleSubmit} className="space-y-3">
   179|          <div className="relative">
   180|            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
   181|              <rect x="2" y="4" width="20" height="16" rx="2"/>
   182|              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
   183|            </svg>
   184|            <input
   185|              type="email"
   186|              value={email}
   187|              onChange={(e) => setEmail(e.target.value)}
   188|              placeholder="Enter your email to create wallet"
   189|              className="w-full pl-10 pr-4 py-3 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
   190|              autoFocus
   191|            />
   192|          </div>
   193|          <div className="flex gap-2">
   194|            <button
   195|              type="button"
   196|              onClick={() => setShowInput(false)}
   197|              className="flex-1 px-4 py-2.5 border border-[#27272A] text-[#A1A1AA] text-sm rounded-lg hover:border-[#3F3F46] transition-colors"
   198|            >
   199|              Back
   200|            </button>
   201|            <button
   202|              type="submit"
   203|              disabled={isConnecting || !email}
   204|              className="flex-1 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
   205|            >
   206|              {isConnecting ? (
   207|                <>
   208|                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
   209|                  Creating...
   210|                </>
   211|              ) : (
   212|                'Create Wallet'
   213|              )}
   214|            </button>
   215|          </div>
   216|          <p className="text-[11px] text-[#52525B] text-center">
   217|            A wallet will be created deterministically from your email
   218|          </p>
   219|        </form>
   220|      )}
   221|    </div>
   222|  );
   223|}
   224|
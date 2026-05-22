     1|import { useState, useEffect } from 'react';
     2|import { motion } from 'framer-motion';
     3|import { Droplets, Clock, CheckCircle, ExternalLink, Wallet, Mail, ArrowRight } from 'lucide-react';
     4|import { checkConnection } from '../utils/contract';
     5|import toast from 'react-hot-toast';
     6|
     7|const FAUCET_API = '/api/faucet';
     8|const EXPLORER = 'https://testnet.qie.digital';
     9|
    10|export default function Faucet() {
    11|  const [address, setAddress] = useState('');
    12|  const [status, setStatus] = useState(null);
    13|  const [loading, setLoading] = useState(false);
    14|  const [dripResult, setDripResult] = useState(null);
    15|  const [checking, setChecking] = useState(false);
    16|
    17|  // Auto-detect wallet
    18|  useEffect(() => {
    19|    checkConnection().then((conn) => {
    20|      if (conn && conn.address) {
    21|        setAddress(conn.address);
    22|        checkStatus(conn.address);
    23|      }
    24|    }).catch(() => {});
    25|  }, []);
    26|
    27|  const checkStatus = async (addr) => {
    28|    if (!addr) return;
    29|    setChecking(true);
    30|    try {
    31|      const res = await fetch(`${FAUCET_API}/status/${addr}`);
    32|      const data = await res.json();
    33|      setStatus(data);
    34|    } catch {
    35|      setStatus(null);
    36|    } finally {
    37|      setChecking(false);
    38|    }
    39|  };
    40|
    41|  const handleDrip = async () => {
    42|    if (!address) {
    43|      toast.error('Connect wallet or enter address');
    44|      return;
    45|    }
    46|    setLoading(true);
    47|    setDripResult(null);
    48|    try {
    49|      const res = await fetch(`${FAUCET_API}/drip`, {
    50|        method: 'POST',
    51|        headers: { 'Content-Type': 'application/json' },
    52|        body: JSON.stringify({ address }),
    53|      });
    54|      const data = await res.json();
    55|      if (data.success) {
    56|        setDripResult(data);
    57|        toast.success(`+${data.amount} QIE sent!`);
    58|        checkStatus(address); // refresh cooldown
    59|      } else {
    60|        toast.error(data.error || 'Faucet request failed');
    61|      }
    62|    } catch (err) {
    63|      toast.error('Network error');
    64|    } finally {
    65|      setLoading(false);
    66|    }
    67|  };
    68|
    69|  const formatTime = (seconds) => {
    70|    if (!seconds || seconds <= 0) return null;
    71|    const h = Math.floor(seconds / 3600);
    72|    const m = Math.floor((seconds % 3600) / 60);
    73|    if (h > 0) return `${h}h ${m}m`;
    74|    return `${m}m`;
    75|  };
    76|
    77|  return (
    78|    <motion.div
    79|      initial={{ opacity: 0, y: 12 }}
    80|      animate={{ opacity: 1, y: 0 }}
    81|      className="max-w-2xl mx-auto space-y-6"
    82|    >
    83|      {/* Header */}
    84|      <div>
    85|        <h1 className="text-xl font-semibold text-[#FAFAFA] flex items-center gap-2">
    86|          <Droplets size={20} className="text-[#10B981]" />
    87|          Testnet Faucet
    88|        </h1>
    89|        <p className="text-sm text-[#A1A1AA] mt-1">
    90|          Get free QIE tokens to test on QIE Testnet (Chain ID 1983)
    91|        </p>
    92|      </div>
    93|
    94|      {/* Info Banner */}
    95|      <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg p-4">
    96|        <div className="flex items-start gap-3">
    97|          <Droplets size={18} className="text-[#10B981] mt-0.5 shrink-0" />
    98|          <div className="text-sm text-[#A1A1AA] space-y-1">
    99|            <p className="text-[#FAFAFA] font-medium">How it works</p>
   100|            <p>Each address can receive <span className="text-[#10B981] font-medium">2 QIE</span> every 24 hours. New email wallets are auto-funded on creation.</p>
   101|            <p>This is a <span className="text-[#FAFAFA]">decentralized on-chain faucet</span> — no backend keys stored in the frontend.</p>
   102|          </div>
   103|        </div>
   104|      </div>
   105|
   106|      {/* Faucet Card */}
   107|      <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 space-y-4">
   108|        {/* Address Input */}
   109|        <div>
   110|          <label className="block text-xs text-[#A1A1AA] mb-1.5">Wallet Address</label>
   111|          <div className="relative">
   112|            <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
   113|            <input
   114|              type="text"
   115|              value={address}
   116|              onChange={(e) => { setAddress(e.target.value); setStatus(null); setDripResult(null); }}
   117|              placeholder="0x..."
   118|              className="w-full pl-10 pr-4 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] font-mono"
   119|            />
   120|          </div>
   121|          <p className="text-[11px] text-[#52525B] mt-1">
   122|            Auto-filled if wallet is connected. Email wallets get auto-funded on creation.
   123|          </p>
   124|        </div>
   125|
   126|        {/* Status */}
   127|        {status && (
   128|          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
   129|            status.canDrip 
   130|              ? 'bg-[#10B981]/10 text-[#10B981]' 
   131|              : 'bg-[#F59E0B]/10 text-[#F59E0B]'
   132|          }`}>
   133|            {status.canDrip ? (
   134|              <>
   135|                <CheckCircle size={14} />
   136|                <span>Ready to claim — {status.dripAmount} QIE available</span>
   137|              </>
   138|            ) : (
   139|              <>
   140|                <Clock size={14} />
   141|                <span>Cooldown active — try again in {formatTime(status.waitSeconds)}</span>
   142|              </>
   143|            )}
   144|          </div>
   145|        )}
   146|
   147|        {/* Drip Result */}
   148|        {dripResult && (
   149|          <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg p-4 space-y-2">
   150|            <div className="flex items-center gap-2 text-[#10B981] font-medium text-sm">
   151|              <CheckCircle size={16} />
   152|              Tokens Sent!
   153|            </div>
   154|            <div className="text-sm text-[#A1A1AA] space-y-1">
   155|              <p>Amount: <span className="text-[#FAFAFA]">{dripResult.amount} QIE</span></p>
   156|              <p>To: <span className="text-[#FAFAFA] font-mono text-xs">{dripResult.to}</span></p>
   157|              <a
   158|                href={`${EXPLORER}/tx/${dripResult.txHash}`}
   159|                target="_blank"
   160|                rel="noopener noreferrer"
   161|                className="inline-flex items-center gap-1 text-[#10B981] hover:underline text-xs"
   162|              >
   163|                View on Explorer <ExternalLink size={12} />
   164|              </a>
   165|            </div>
   166|          </div>
   167|        )}
   168|
   169|        {/* Actions */}
   170|        <div className="flex gap-2">
   171|          <button
   172|            onClick={() => checkStatus(address)}
   173|            disabled={!address || checking}
   174|            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#27272A] text-[#A1A1AA] text-sm rounded-lg hover:border-[#3F3F46] transition-colors disabled:opacity-50"
   175|          >
   176|            {checking ? (
   177|              <span className="w-4 h-4 border-2 border-[#27272A] border-t-[#A1A1AA] rounded-full animate-spin" />
   178|            ) : (
   179|              <Clock size={14} />
   180|            )}
   181|            Check Status
   182|          </button>
   183|          <button
   184|            onClick={handleDrip}
   185|            disabled={!address || loading || (status && !status.canDrip)}
   186|            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
   187|          >
   188|            {loading ? (
   189|              <>
   190|                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
   191|                Sending...
   192|              </>
   193|            ) : (
   194|              <>
   195|                <Droplets size={14} />
   196|                Claim 2 QIE
   197|              </>
   198|            )}
   199|          </button>
   200|        </div>
   201|      </div>
   202|
   203|      {/* Email Wallet CTA */}
   204|      <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5">
   205|        <div className="flex items-center gap-3 mb-3">
   206|          <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
   207|            <Mail size={16} className="text-[#10B981]" />
   208|          </div>
   209|          <div>
   210|            <h3 className="text-sm font-medium text-[#FAFAFA]">Don't have a wallet?</h3>
   211|            <p className="text-xs text-[#A1A1AA]">Create one with just your email — auto-funded!</p>
   212|          </div>
   213|        </div>
   214|        <a
   215|          href="/"
   216|          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#09090B] border border-[#27272A] hover:border-[#10B981] text-sm text-[#FAFAFA] rounded-lg transition-colors"
   217|        >
   218|          Create Email Wallet <ArrowRight size={14} />
   219|        </a>
   220|      </div>
   221|
   222|      {/* Contract Info */}
   223|      <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4 space-y-2">
   224|        <h3 className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Faucet Contract</h3>
   225|        <a
   226|          href={`${EXPLORER}/address/0xe0BC1D6CC58E091F6A2866788D7D938895E1E2a6`}
   227|          target="_blank"
   228|          rel="noopener noreferrer"
   229|          className="flex items-center gap-2 text-sm text-[#10B981] hover:underline font-mono"
   230|        >
   231|          0xe0BC1D6C...95E1E2a6 <ExternalLink size={12} />
   232|        </a>
   233|        <p className="text-xs text-[#52525B]">109.5 QIE funded • 2 QIE per drip • 24h cooldown</p>
   234|      </div>
   235|    </motion.div>
   236|  );
   237|}
   238|
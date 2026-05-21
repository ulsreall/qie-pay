import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Webhook, Bell, Send, Trash2, Check, X, ChevronDown, Copy, ExternalLink, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const EVENTS = ['PaymentCreated', 'PaymentPaid', 'PaymentSettled', 'PaymentRefunded', 'PaymentCancelled'];

const EXAMPLE_PAYLOAD = {
  event: "PaymentPaid",
  paymentId: 1,
  merchant: "0x...",
  customer: "0x...",
  amount: "200000000000000000",
  amountQIE: "0.2000",
  description: "Coffee",
  orderId: "ORD-123",
  timestamp: 1719012345,
  txHash: "0x...",
  chainId: 1983,
  contract: "0xFFC670DA0f40c1602175415abd9CEcd6d6BADD42"
};

function CodeBlock({ code, language = 'json' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(typeof code === 'string' ? code : JSON.stringify(code, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlight = (str) => {
    if (language === 'json') {
      return str.replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
        .replace(/:\s*"([^"]*)"/g, ': <span class="text-emerald-400">"$1"</span>')
        .replace(/:\s*(\d+)/g, ': <span class="text-amber-400">$1</span>');
    }
    return str;
  };

  const formatted = typeof code === 'string' ? code : JSON.stringify(code, null, 2);

  return (
    <div className="relative group">
      <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10">
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
      </button>
      <pre className="bg-black/40 border border-white/5 rounded-xl p-4 overflow-x-auto text-sm font-mono">
        <code dangerouslySetInnerHTML={{ __html: highlight(formatted) }} />
      </pre>
    </div>
  );
}

export default function Webhooks() {
  const [wallet, setWallet] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(['PaymentPaid', 'PaymentSettled']);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const storageKey = wallet ? `webhook_${wallet}` : '';

  useEffect(() => {
    const check = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts[0]) setWallet(accounts[0]);
        } catch {}
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (!storageKey) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const cfg = JSON.parse(saved);
      setWebhookUrl(cfg.url || '');
      setEnabled(cfg.enabled || false);
      setSelectedEvents(cfg.events || []);
    }
    const logs = localStorage.getItem(`${storageKey}_logs`);
    if (logs) setEventLog(JSON.parse(logs));
  }, [storageKey]);

  const saveConfig = () => {
    if (!webhookUrl) return toast.error('Enter a webhook URL');
    localStorage.setItem(storageKey, JSON.stringify({ url: webhookUrl, enabled, events: selectedEvents }));
    toast.success('Webhook configuration saved');
  };

  const toggleEvent = (ev) => {
    setSelectedEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  };

  const clearLogs = () => {
    setEventLog([]);
    localStorage.removeItem(`${storageKey}_logs`);
    toast.success('Event log cleared');
  };

  const testWebhook = async () => {
    if (!webhookUrl) return toast.error('Configure a webhook URL first');
    setTesting(true);
    setTestResult(null);
    const payload = { ...EXAMPLE_PAYLOAD, _test: true, timestamp: Math.floor(Date.now() / 1000) };
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      setTestResult({ status: 'sent', code: 'opaque (no-cors)', body: 'Request sent. Since mode is no-cors, response body is not readable. Check your server logs.' });
      const newLog = { time: new Date().toISOString(), event: 'TestEvent', paymentId: '-', status: 'sent', code: 'no-cors' };
      const updated = [newLog, ...eventLog].slice(0, 50);
      setEventLog(updated);
      if (storageKey) localStorage.setItem(`${storageKey}_logs`, JSON.stringify(updated));
      toast.success('Test event sent');
    } catch (err) {
      setTestResult({ status: 'error', code: 'ERR', body: err.message });
      const newLog = { time: new Date().toISOString(), event: 'TestEvent', paymentId: '-', status: 'failed', code: 'ERR' };
      const updated = [newLog, ...eventLog].slice(0, 50);
      setEventLog(updated);
      if (storageKey) localStorage.setItem(`${storageKey}_logs`, JSON.stringify(updated));
      toast.error('Failed to send test event');
    }
    setTesting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center"><Webhook className="text-purple-400" size={22} /></div>
          <h1 className="text-2xl font-bold text-white">Webhook Integration</h1>
        </div>
        <p className="text-gray-400 ml-[52px]">Get notified when payments are received. Configure your webhook endpoint to receive real-time payment events.</p>
      </div>

      {/* Demo notice */}
      <div className="glass rounded-xl p-4 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
        <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-amber-200/80">This is a demo preview of the webhook system. In production, webhooks are fired server-side. Here, events are simulated and logged locally.</p>
      </div>

      {/* Configure Endpoint */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Bell size={18} className="text-purple-400" /> Configure Endpoint</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Webhook URL</label>
          <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Events to Listen</label>
          <div className="relative">
            <button onClick={() => setEventsOpen(!eventsOpen)} className="input-field w-full flex items-center justify-between">
              <span className="text-sm">{selectedEvents.length ? `${selectedEvents.length} event(s) selected` : 'Select events...'}</span>
              <ChevronDown size={16} className={`transition-transform ${eventsOpen ? 'rotate-180' : ''}`} />
            </button>
            {eventsOpen && (
              <div className="absolute z-20 top-full mt-1 w-full glass rounded-xl p-2 space-y-1">
                {EVENTS.map(ev => (
                  <label key={ev} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" checked={selectedEvents.includes(ev)} onChange={() => toggleEvent(ev)} className="accent-purple-500" />
                    <span className="text-sm text-gray-300">{ev}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Enable Webhook</span>
          <button onClick={() => setEnabled(!enabled)} className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-purple-500' : 'bg-white/10'}`}>
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${enabled ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
        <button onClick={saveConfig} className="btn-primary">Save Configuration</button>
      </div>

      {/* Payload Format */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><ExternalLink size={18} className="text-purple-400" /> Webhook Payload Format</h2>
        <p className="text-sm text-gray-400">Your endpoint will receive a POST request with this JSON body:</p>
        <CodeBlock code={EXAMPLE_PAYLOAD} language="json" />
      </div>

      {/* Test Webhook */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Send size={18} className="text-purple-400" /> Test Webhook</h2>
        <p className="text-sm text-gray-400">Send a test event to verify your endpoint is working.</p>
        <button onClick={testWebhook} disabled={testing} className="btn-secondary flex items-center gap-2">
          <Send size={16} /> {testing ? 'Sending...' : 'Send Test Event'}
        </button>
        {testResult && (
          <div className={`rounded-xl p-4 text-sm ${testResult.status === 'sent' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
            <p className="font-medium mb-1">Status: {testResult.status} ({testResult.code})</p>
            <p className="text-xs opacity-80">{testResult.body}</p>
          </div>
        )}
      </div>

      {/* Event Log */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Clock size={18} className="text-purple-400" /> Event Log</h2>
          {eventLog.length > 0 && (
            <button onClick={clearLogs} className="btn-secondary text-xs flex items-center gap-1"><Trash2 size={14} /> Clear Log</button>
          )}
        </div>
        {eventLog.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Webhook size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No webhook events yet. Events will appear here when payments are received.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-white/5">
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Event</th>
                  <th className="pb-2 pr-4">Payment ID</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Code</th>
                </tr>
              </thead>
              <tbody>
                {eventLog.map((log, i) => (
                  <tr key={i} className="border-b border-white/5 text-gray-300">
                    <td className="py-2 pr-4 text-xs text-gray-500">{new Date(log.time).toLocaleString()}</td>
                    <td className="py-2 pr-4"><span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-xs">{log.event}</span></td>
                    <td className="py-2 pr-4 font-mono text-xs">{log.paymentId}</td>
                    <td className="py-2 pr-4">{log.status === 'sent' || log.status === 'success' ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-red-400" />}</td>
                    <td className="py-2 font-mono text-xs">{log.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

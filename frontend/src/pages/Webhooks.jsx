import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Webhook, Bell, Send, Trash2, Check, X, ChevronDown, Copy,
  AlertCircle, Clock, Link as LinkIcon
} from 'lucide-react';
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

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(typeof code === 'string' ? code : JSON.stringify(code, null, 2));
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatted = typeof code === 'string' ? code : JSON.stringify(code, null, 2);

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors z-10"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-400" />}
      </button>
      <pre className="bg-slate-900 rounded-md p-3 overflow-x-auto text-xs font-mono text-slate-300">
        <code>{formatted}</code>
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
      const newLog = { time: new Date().toISOString(), event: 'TestEvent', paymentId: '—', status: 'sent', code: 'no-cors' };
      const updated = [newLog, ...eventLog].slice(0, 50);
      setEventLog(updated);
      if (storageKey) localStorage.setItem(`${storageKey}_logs`, JSON.stringify(updated));
      toast.success('Test event sent');
    } catch (err) {
      setTestResult({ status: 'error', code: 'ERR', body: err.message });
      const newLog = { time: new Date().toISOString(), event: 'TestEvent', paymentId: '—', status: 'failed', code: 'ERR' };
      const updated = [newLog, ...eventLog].slice(0, 50);
      setEventLog(updated);
      if (storageKey) localStorage.setItem(`${storageKey}_logs`, JSON.stringify(updated));
      toast.error('Failed to send test event');
    }
    setTesting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-slate-50 flex items-center gap-2 tracking-tight">
            <Webhook size={16} className="text-emerald-400" />
            Webhook Integration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 ml-6">
            Get notified when payments are received. Configure your webhook endpoint to receive real-time events.
          </p>
        </div>

        {/* Demo notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={14} />
          <p className="text-xs text-amber-200/80">
            This is a demo preview. In production, webhooks are fired server-side. Here, events are simulated and logged locally.
          </p>
        </div>

        {/* Configure Endpoint */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Bell size={14} className="text-emerald-400" /> Configure Endpoint
          </h2>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-50 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Events to Listen</label>
            <div className="relative">
              <button
                onClick={() => setEventsOpen(!eventsOpen)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-300 flex items-center justify-between text-left"
              >
                <span>{selectedEvents.length ? `${selectedEvents.length} event(s) selected` : 'Select events...'}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${eventsOpen ? 'rotate-180' : ''}`} />
              </button>
              {eventsOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-md p-1.5 space-y-0.5 shadow-lg">
                  {EVENTS.map(ev => (
                    <label key={ev} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev)}
                        onChange={() => toggleEvent(ev)}
                        className="accent-emerald-500"
                      />
                      <span className="text-xs text-slate-300">{ev}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-400">Enable Webhook</span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <button
            onClick={saveConfig}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md px-3 py-1.5 text-xs transition-colors"
          >
            Save Configuration
          </button>
        </div>

        {/* Payload Format */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <LinkIcon size={14} className="text-emerald-400" /> Webhook Payload Format
          </h2>
          <p className="text-xs text-slate-400">Your endpoint will receive a POST request with this JSON body:</p>
          <CodeBlock code={EXAMPLE_PAYLOAD} />
        </div>

        {/* Test Webhook */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Send size={14} className="text-emerald-400" /> Test Webhook
          </h2>
          <p className="text-xs text-slate-400">Send a test event to verify your endpoint is working.</p>
          <button
            onClick={testWebhook}
            disabled={testing}
            className="inline-flex items-center gap-1.5 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-md px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            <Send size={12} /> {testing ? 'Sending...' : 'Send Test Event'}
          </button>
          {testResult && (
            <div className={`rounded-md p-3 text-xs ${
              testResult.status === 'sent'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              <p className="font-medium mb-0.5">Status: {testResult.status} ({testResult.code})</p>
              <p className="text-xs opacity-80">{testResult.body}</p>
            </div>
          )}
        </div>

        {/* Event Log */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-400" /> Event Log
            </h2>
            {eventLog.length > 0 && (
              <button
                onClick={clearLogs}
                className="inline-flex items-center gap-1 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-md px-2 py-1 text-xs transition-colors"
              >
                <Trash2 size={11} /> Clear
              </button>
            )}
          </div>

          {eventLog.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Webhook size={24} className="mx-auto mb-1.5 opacity-40" />
              <p className="text-xs">No webhook events yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-1.5 pr-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="pb-1.5 pr-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Event</th>
                    <th className="pb-1.5 pr-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Payment ID</th>
                    <th className="pb-1.5 pr-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="pb-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {eventLog.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2 pr-3 text-xs text-slate-500">
                        {new Date(log.time).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs">
                          {log.event}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-slate-300">{log.paymentId}</td>
                      <td className="py-2 pr-3">
                        {log.status === 'sent' || log.status === 'success'
                          ? <Check size={12} className="text-emerald-400" />
                          : <X size={12} className="text-red-400" />
                        }
                      </td>
                      <td className="py-2 font-mono text-xs text-slate-400">{log.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

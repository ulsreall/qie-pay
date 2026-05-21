import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Webhook, Bell, Send, Trash2, Check, X, ChevronDown, Copy,
  ExternalLink, AlertCircle, Clock, Link as LinkIcon
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

function CodeBlock({ code, language = 'json' }) {
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
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors z-10"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
      </button>
      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300">
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Webhook size={18} className="text-emerald-500" />
            </div>
            Webhook Integration
          </h1>
          <p className="text-slate-400 text-sm mt-2 ml-12">
            Get notified when payments are received. Configure your webhook endpoint to receive real-time payment events.
          </p>
        </div>

        {/* Demo notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-200/80">
            This is a demo preview of the webhook system. In production, webhooks are fired server-side. Here, events are simulated and logged locally.
          </p>
        </div>

        {/* Configure Endpoint */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <Bell size={18} className="text-emerald-500" /> Configure Endpoint
          </h2>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-50 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Events to Listen</label>
            <div className="relative">
              <button
                onClick={() => setEventsOpen(!eventsOpen)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-50 flex items-center justify-between text-left"
              >
                <span>{selectedEvents.length ? `${selectedEvents.length} event(s) selected` : 'Select events...'}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${eventsOpen ? 'rotate-180' : ''}`} />
              </button>
              {eventsOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl p-2 space-y-1 shadow-lg">
                  {EVENTS.map(ev => (
                    <label key={ev} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev)}
                        onChange={() => toggleEvent(ev)}
                        className="accent-emerald-500"
                      />
                      <span className="text-sm text-slate-300">{ev}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-400">Enable Webhook</span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${enabled ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <button
            onClick={saveConfig}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            Save Configuration
          </button>
        </div>

        {/* Payload Format */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <LinkIcon size={18} className="text-emerald-500" /> Webhook Payload Format
          </h2>
          <p className="text-sm text-slate-400">Your endpoint will receive a POST request with this JSON body:</p>
          <CodeBlock code={EXAMPLE_PAYLOAD} language="json" />
        </div>

        {/* Test Webhook */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <Send size={18} className="text-emerald-500" /> Test Webhook
          </h2>
          <p className="text-sm text-slate-400">Send a test event to verify your endpoint is working.</p>
          <button
            onClick={testWebhook}
            disabled={testing}
            className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            <Send size={14} /> {testing ? 'Sending...' : 'Send Test Event'}
          </button>
          {testResult && (
            <div className={`rounded-xl p-4 text-sm ${
              testResult.status === 'sent'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              <p className="font-medium mb-1">Status: {testResult.status} ({testResult.code})</p>
              <p className="text-xs opacity-80">{testResult.body}</p>
            </div>
          )}
        </div>

        {/* Event Log */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" /> Event Log
            </h2>
            {eventLog.length > 0 && (
              <button
                onClick={clearLogs}
                className="inline-flex items-center gap-1 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-3 py-1.5 text-xs transition-colors"
              >
                <Trash2 size={12} /> Clear Log
              </button>
            )}
          </div>

          {eventLog.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Webhook size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No webhook events yet. Events will appear here when payments are received.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-2 pr-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Event</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Payment ID</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {eventLog.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 pr-4 text-xs text-slate-500">
                        {new Date(log.time).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          {log.event}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">{log.paymentId}</td>
                      <td className="py-2.5 pr-4">
                        {log.status === 'sent' || log.status === 'success'
                          ? <Check size={14} className="text-emerald-400" />
                          : <X size={14} className="text-red-400" />
                        }
                      </td>
                      <td className="py-2.5 font-mono text-xs text-slate-400">{log.code}</td>
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

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Upload, Save, Loader2, Globe, Tag, DollarSign, Image,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { checkConnection } from '../utils/contract';

const CATEGORIES = [
  'Food & Beverage',
  'Retail',
  'Services',
  'Digital Products',
  'Other',
];

const DEBOUNCE_MS = 500;
const MAX_LOGO_SIZE = 200 * 1024; // 200KB

function getStorageKey(address, field) {
  return `merchant_${address?.toLowerCase() || 'unknown'}_${field}`;
}

function loadSettings(address) {
  if (!address) return { name: '', desc: '', category: 'Other', currencyPref: 'qie', logo: '' };
  return {
    name: localStorage.getItem(getStorageKey(address, 'name')) || '',
    desc: localStorage.getItem(getStorageKey(address, 'desc')) || '',
    category: localStorage.getItem(getStorageKey(address, 'category')) || 'Other',
    currencyPref: localStorage.getItem(getStorageKey(address, 'currencyPref')) || 'qie',
    logo: localStorage.getItem(getStorageKey(address, 'logo')) || '',
  };
}

function saveSettings(address, settings) {
  if (!address) return;
  try {
    localStorage.setItem(getStorageKey(address, 'name'), settings.name);
    localStorage.setItem(getStorageKey(address, 'desc'), settings.desc);
    localStorage.setItem(getStorageKey(address, 'category'), settings.category);
    localStorage.setItem(getStorageKey(address, 'currencyPref'), settings.currencyPref);
    localStorage.setItem(getStorageKey(address, 'logo'), settings.logo);
  } catch {
    // localStorage full or unavailable
  }
}

export default function MerchantSettings() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Other');
  const [currencyPref, setCurrencyPref] = useState('qie');
  const [logo, setLogo] = useState('');

  const debounceRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load wallet + settings on mount
  useEffect(() => {
    const init = async () => {
      try {
        const conn = await checkConnection();
        if (conn) {
          setWallet(conn);
          const settings = loadSettings(conn.address);
          setName(settings.name);
          setDesc(settings.desc);
          setCategory(settings.category);
          setCurrencyPref(settings.currencyPref);
          setLogo(settings.logo);
        }
      } catch {
        // no wallet
      }
      setLoading(false);
    };
    init();
  }, []);

  // Auto-save debounce
  const autoSave = useCallback(() => {
    if (!wallet?.address) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveSettings(wallet.address, { name, desc, category, currencyPref, logo });
    }, DEBOUNCE_MS);
  }, [wallet?.address, name, desc, category, currencyPref, logo]);

  useEffect(() => {
    autoSave();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [autoSave]);

  const handleSave = () => {
    if (!wallet?.address) {
      toast.error('Connect your wallet first');
      return;
    }
    setSaving(true);
    saveSettings(wallet.address, { name, desc, category, currencyPref, logo });
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved');
    }, 300);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE) {
      toast.error('Logo must be under 200KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result);
      toast.success('Logo uploaded');
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const truncateAddress = (addr) => addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '';

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-[#111113] rounded" />
          <div className="h-4 w-64 bg-[#111113] rounded" />
          <div className="h-64 bg-[#111113] rounded-lg mt-6" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">Merchant Settings</h1>
            <p className="text-xs text-[#71717A] mt-0.5">Manage your business profile and preferences</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !wallet}
            className="flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-4 py-2 text-xs transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </button>
        </div>

        {!wallet ? (
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-8 text-center">
            <Store size={32} className="text-[#52525B] mx-auto mb-3" />
            <p className="text-sm text-[#A1A1AA] mb-1">Connect your wallet to manage settings</p>
            <p className="text-xs text-[#71717A]">Your settings are stored locally per wallet address</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Form */}
            <div className="space-y-4">
              {/* Business Name */}
              <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Store size={14} className="text-[#34D399]" />
                  <h2 className="text-sm font-semibold text-[#A1A1AA]">Business Info</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#71717A] mb-1.5 block">Business Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. My Coffee Shop"
                      className="w-full bg-[#111113] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#3F3F46] transition-colors duration-150"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#71717A] mb-1.5 block">Business Description</label>
                    <textarea
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Tell customers about your business..."
                      rows={3}
                      className="w-full bg-[#111113] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#3F3F46] transition-colors duration-150 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#71717A] mb-1.5 block">Business Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#111113] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46] transition-colors duration-150 appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={14} className="text-[#34D399]" />
                  <h2 className="text-sm font-semibold text-[#A1A1AA]">Preferences</h2>
                </div>

                <div>
                  <label className="text-xs text-[#71717A] mb-1.5 block">Display Currency</label>
                  <p className="text-[11px] text-[#52525B] mb-3">Choose which currency is shown as primary to customers</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setCurrencyPref('qie')}
                      className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 border ${
                        currencyPref === 'qie'
                          ? 'bg-[#10B981]/10 border-[#10B981] text-[#34D399]'
                          : 'bg-transparent border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                      }`}
                    >
                      QIE Primary
                    </button>
                    <button
                      onClick={() => setCurrencyPref('usd')}
                      className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 border ${
                        currencyPref === 'usd'
                          ? 'bg-[#10B981]/10 border-[#10B981] text-[#34D399]'
                          : 'bg-transparent border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                      }`}
                    >
                      USD Primary
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Image size={14} className="text-[#34D399]" />
                  <h2 className="text-sm font-semibold text-[#A1A1AA]">Business Logo</h2>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {logo ? (
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-20 h-20 rounded-lg border border-[#27272A] bg-[#09090B] flex items-center justify-center overflow-hidden">
                      <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-[#A1A1AA]">Logo uploaded</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-[#38BDF8] hover:text-[#7DD3FC] transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          onClick={removeLogo}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-[#27272A] hover:border-[#3F3F46] rounded-md p-6 text-center transition-colors duration-150"
                  >
                    <Upload size={20} className="text-[#52525B] mx-auto mb-2" />
                    <p className="text-xs text-[#A1A1AA]">Click to upload logo</p>
                    <p className="text-[11px] text-[#52525B] mt-0.5">PNG, JPG, WebP or SVG · Max 200KB</p>
                  </button>
                )}
              </div>
            </div>

            {/* Right column: Preview */}
            <div className="space-y-4">
              <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={14} className="text-[#34D399]" />
                  <h2 className="text-sm font-semibold text-[#A1A1AA]">Public Profile Preview</h2>
                </div>
                <p className="text-[11px] text-[#52525B] mb-4">This is how customers will see your merchant profile</p>

                {/* Preview card */}
                <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center overflow-hidden shrink-0">
                      {logo ? (
                        <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Store size={20} className="text-[#52525B]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#FAFAFA] truncate">
                        {name || 'Your Business Name'}
                      </h3>
                      <p className="text-xs text-[#71717A] font-mono mt-0.5">
                        {truncateAddress(wallet?.address)}
                      </p>
                    </div>
                  </div>

                  {desc && (
                    <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">{desc}</p>
                  )}

                  <div className="flex items-center gap-3 pt-3 border-t border-[#27272A]">
                    <div className="flex items-center gap-1.5">
                      <Tag size={12} className="text-[#71717A]" />
                      <span className="text-xs text-[#71717A]">{category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={12} className="text-[#71717A]" />
                      <span className="text-xs text-[#71717A]">
                        {currencyPref === 'qie' ? 'QIE' : 'USD'} primary
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info note */}
                <div className="mt-4 px-3 py-2.5 bg-[#09090B] rounded-md border border-[#27272A]">
                  <p className="text-[11px] text-[#52525B] leading-relaxed">
                    Your profile is shown on your public storefront page. Settings are stored locally
                    in your browser and linked to your wallet address.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { Smartphone, Hash, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import type { PaymentMethod, HotspotPlan } from '../types.ts';

interface PaymentFormProps {
  selectedMethod: PaymentMethod;
  selectedPlan: HotspotPlan;
  deviceIp: string;
  deviceMac: string;
  deviceName: string;
  onSubmit: (data: {
    method: PaymentMethod;
    planId: string;
    senderPhone: string;
    trxId: string;
    deviceIp: string;
    deviceMac: string;
    deviceName: string;
  }) => Promise<void>;
  isLoading: boolean;
  onSelectMethod: (method: PaymentMethod) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedMethod,
  selectedPlan,
  deviceIp,
  deviceMac,
  deviceName,
  onSubmit,
  isLoading,
  onSelectMethod,
}) => {
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Normalize phone number (strip whitespace, hyphens, and optional +88/88 prefix)
    let cleanPhone = senderPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('8801')) {
      cleanPhone = cleanPhone.slice(2);
    }

    // Allow any standard 11-digit numbers starting with 01
    if (!cleanPhone.startsWith('01') || cleanPhone.length !== 11) {
      setError('Please enter an 11-digit mobile number starting with 01 (e.g. 01904031478)');
      return;
    }

    // Allow any alphanumeric string of at least 6 characters
    const cleanTrx = trxId.trim().toUpperCase();
    if (cleanTrx.length < 6) {
      setError('Please enter a valid Transaction ID (at least 6 characters)');
      return;
    }

    try {
      await onSubmit({
        method: selectedMethod,
        planId: selectedPlan.id,
        senderPhone: cleanPhone,
        trxId: cleanTrx,
        deviceIp,
        deviceMac,
        deviceName,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit payment verification request.');
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Submit Payment Verification</h2>
        <p className="font-bangla text-xs text-slate-500">পেমেন্ট সম্পন্ন করার পর তথ্য দিয়ে সাবমিট করুন</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate={false} className="space-y-4">
        {/* Method & Plan Summary Row */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Selected Method:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${selectedMethod === 'bKash' ? 'bg-[#D12053]' : 'bg-[#F7941D]'}`} />
              <span className="font-bold text-slate-900">{selectedMethod}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Package & Fee:</span>
            <div className="font-bold text-slate-900 mt-0.5">
              {selectedPlan.name} (৳{selectedPlan.price})
            </div>
          </div>
        </div>

        {/* Sender Mobile Number - without strict regex or HTML5 pattern restrictions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Sender Mobile Number (প্রেরক মোবাইল নম্বর)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              required
              placeholder="01XXXXXXXXX"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-bangla">
            যে বিকাশ বা নগদ নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন (যেকোনো ১১ ডিজিটের নম্বর)
          </p>
        </div>

        {/* Transaction ID - without strict regex or HTML5 pattern restrictions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Transaction ID (TrxID / ট্রানজেকশন আইডি)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              placeholder="Enter TrxID (minimum 6 characters)..."
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-3 py-2.5 text-sm font-mono uppercase tracking-wider border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-bangla">
            পেমেন্ট সফল হওয়ার পর ফিরতি এসএমএসের TrxID এখানে দিন (কমপক্ষে ৬ অক্ষর)
          </p>
        </div>

        {/* Auto-detected Device Info banner */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Target Device Fingerprint (স্বয়ংক্রিয় শনাক্তকৃত ডিভাইস)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-600 tabular-nums">
            <div>Public IP: <span className="font-semibold text-slate-900">{deviceIp}</span></div>
            <div>Device ID: <span className="font-semibold text-slate-900">{deviceMac}</span></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">
            Internet will be activated instantly on this device upon admin confirmation.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting for Verification...</span>
            </>
          ) : (
            <>
              <span>Verify & Connect Internet</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

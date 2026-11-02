import React, { useState } from 'react';
import { Copy, Check, Info, ArrowRight } from 'lucide-react';
import type { PaymentMethod, PortalSettings } from '../types.ts';

interface MfsPaymentBoxProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  settings: PortalSettings;
  amount: number;
}

export const MfsPaymentBox: React.FC<MfsPaymentBoxProps> = ({
  selectedMethod,
  onSelectMethod,
  settings,
  amount,
}) => {
  const [copied, setCopied] = useState(false);

  const activeNumber = selectedMethod === 'bKash' ? settings.bkashNumber : settings.nagadNumber;

  const handleCopy = () => {
    // Strip non-digits for clipboard
    const cleanNumber = activeNumber.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(cleanNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="payment-instructions" className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Payment Method & MFS Accounts</h2>
          <p className="font-bangla text-xs text-slate-500">বিকাশ অথবা নগদ এর মাধ্যমে সেন্ড মানি করুন</p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
          Payable: <span className="font-mono text-slate-900 font-bold tabular-nums">৳{amount}</span>
        </div>
      </div>

      {/* Method Selector Tabs */}
      <div className="grid grid-cols-2 gap-3">
        {/* bKash Button */}
        <button
          type="button"
          onClick={() => onSelectMethod('bKash')}
          className={`flex items-center justify-center gap-2.5 p-3 rounded-lg border-2 transition-all cursor-pointer ${
            selectedMethod === 'bKash'
              ? 'border-pink-600 bg-pink-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="w-6 h-6 rounded-md bg-[#D12053] text-white flex items-center justify-center font-bold text-xs">
            b
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900 leading-tight">bKash</p>
            <p className="text-[11px] text-slate-500 font-bangla">বিকাশ পার্সোনাল</p>
          </div>
        </button>

        {/* Nagad Button */}
        <button
          type="button"
          onClick={() => onSelectMethod('Nagad')}
          className={`flex items-center justify-center gap-2.5 p-3 rounded-lg border-2 transition-all cursor-pointer ${
            selectedMethod === 'Nagad'
              ? 'border-amber-600 bg-amber-50/50 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="w-6 h-6 rounded-md bg-[#F7941D] text-white flex items-center justify-center font-bold text-xs">
            ন
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900 leading-tight">Nagad</p>
            <p className="text-[11px] text-slate-500 font-bangla">নগদ পার্সোনাল</p>
          </div>
        </button>
      </div>

      {/* Account Number & Copy Box */}
      <div className={`p-4 rounded-xl border ${
        selectedMethod === 'bKash' 
          ? 'bg-pink-50/30 border-pink-200' 
          : 'bg-amber-50/30 border-amber-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {selectedMethod} Personal / Send Money Number
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 tracking-wider">
                {activeNumber}
              </span>
            </div>
            <p className="font-bangla text-xs text-slate-600 mt-0.5">
              এই নম্বরে <strong className="text-slate-900">৳{amount}</strong> সেন্ড মানি (Send Money) করুন
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-xs'
                : selectedMethod === 'bKash'
                ? 'bg-[#D12053] hover:bg-[#b01642] text-white shadow-xs'
                : 'bg-[#F7941D] hover:bg-[#d97c11] text-white shadow-xs'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Number</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step-by-Step Instructions */}
      <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>How to Pay & Connect (পেমেন্ট নিয়মাবলি):</span>
        </div>
        <ol className="space-y-1.5 text-xs text-slate-600 font-bangla">
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-sans font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>আপনার {selectedMethod} অ্যাপে যান অথবা ডায়াল কোড ব্যবহার করুন।</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-sans font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span><strong className="text-slate-800">Send Money</strong> অপশন নির্বাচন করে উপরের নম্বরে <strong className="text-slate-800">৳{amount}</strong> সেন্ড করুন।</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-sans font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>সফল পেমেন্টের পর পাওয়া <strong className="text-slate-800">TrxID</strong> কপি করে নিচের ফর্মে জমা দিন।</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

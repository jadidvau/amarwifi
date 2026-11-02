import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  RotateCw, 
  ArrowLeft, 
  MessageSquare,
  Radio 
} from 'lucide-react';
import type { HotspotRequest } from '../types.ts';
import { pollRequestStatus } from '../lib/api.ts';

interface WaitingScreenProps {
  request: HotspotRequest;
  deviceMac: string;
  onApproved: () => void;
  onEditOrRetry: () => void;
  onOpenAdmin: () => void;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  request,
  deviceMac,
  onApproved,
  onEditOrRetry,
  onOpenAdmin,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('Just now');

  // Timer for elapsed seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time polling check
  useEffect(() => {
    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await pollRequestStatus(deviceMac, request.id);
        if (!isMounted) return;

        setLastChecked(new Date().toLocaleTimeString());

        if (res.isApproved) {
          clearInterval(pollInterval);
          onApproved();
        } else if (res.isRejected || res.request?.status === 'rejected') {
          setIsRejected(true);
          setRejectReason(res.request?.rejectReason || 'Payment could not be verified by admin.');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.warn('Polling status note:', err);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [deviceMac, request.id, onApproved]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins > 0 ? `${mins}m ` : ''}${s}s`;
  };

  return (
    <div className="max-w-xl mx-auto rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm text-center">
      {!isRejected ? (
        <>
          {/* Animated Verification Pulse */}
          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
            <span className="absolute inset-1 rounded-full bg-emerald-100" />
            <div className="relative z-10 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1" style={{ textWrap: 'balance' }}>
            Request is pending, admin is verifying your payment
          </h2>
          <p className="font-bangla text-sm text-emerald-800 font-medium mb-2">
            আপনার অনুরোধটি প্রক্রিয়াধীন রয়েছে, অ্যাডমিন পেমেন্ট যাচাই করছেন
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            This usually takes 1 to 2 minutes. This page will automatically update and connect you to the internet the moment your TrxID is approved.
          </p>

          {/* Submission Details Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-3 mb-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-xs">
              <span className="text-slate-500 font-medium">Payment Method:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${request.method === 'bKash' ? 'bg-[#D12053]' : 'bg-[#F7941D]'}`} />
                {request.method} (৳{request.amount})
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-xs">
              <span className="text-slate-500 font-medium">Sender Mobile:</span>
              <span className="font-mono font-bold text-slate-900">{request.senderPhone}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-xs">
              <span className="text-slate-500 font-medium">Transaction ID:</span>
              <span className="font-mono font-extrabold text-slate-900 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                {request.trxId}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Device ID / IP:</span>
              <span className="font-mono text-slate-700 text-[11px] tabular-nums">
                {request.deviceMac} · {request.deviceIp}
              </span>
            </div>
          </div>

          {/* Live Status Indicator Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2 mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Elapsed: <strong className="font-mono text-slate-700">{formatElapsed(elapsedSeconds)}</strong></span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <RotateCw className="w-3 h-3 animate-spin text-emerald-600" />
              <span>Auto-verifying ({lastChecked})</span>
            </span>
          </div>

          {/* WhatsApp Admin Support Contact */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-bangla">জরুরি প্রয়োজনে অ্যাডমিনের সাথে যোগাযোগ করুন:</span>
            <a
              href="https://wa.me/8801980000601"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors border border-emerald-200"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp: 01980000601</span>
            </a>
          </div>
        </>
      ) : (
        /* Rejected State */
        <>
          <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Payment Verification Failed
          </h2>
          <p className="font-bangla text-sm text-rose-700 font-medium mb-3">
            পেমেন্ট নিশ্চিত করা যায়নি বা ট্রানজেকশন আইডি সঠিক নয়
          </p>
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 text-left mb-6">
            <p className="font-semibold mb-0.5">Admin Note / কারণ:</p>
            <p>{rejectReason || 'TrxID was not found in the MFS statement.'}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onEditOrRetry}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Re-enter TrxID or Try Again (পুনরায় চেষ্টা করুন)</span>
            </button>

            <a
              href="https://wa.me/8801980000601"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-emerald-200"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Contact Admin on WhatsApp (01980000601)</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  CheckCircle2, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  ShieldCheck, 
  Globe, 
  LogOut, 
  Zap, 
  Activity, 
  ExternalLink 
} from 'lucide-react';
import type { ConnectedDevice, HotspotRequest, PortalSettings } from '../types.ts';

interface OnlineScreenProps {
  device: ConnectedDevice | null;
  request: HotspotRequest | null;
  settings: PortalSettings;
  deviceMac: string;
  deviceIp: string;
  onDisconnect: () => void;
  onOpenAdmin: () => void;
}

export const OnlineScreen: React.FC<OnlineScreenProps> = ({
  device,
  request,
  settings,
  deviceMac,
  deviceIp,
  onDisconnect,
  onOpenAdmin,
}) => {
  const [downloadSpeed, setDownloadSpeed] = useState(26.8);
  const [uploadSpeed, setUploadSpeed] = useState(12.4);
  const [dataUsedMb, setDataUsedMb] = useState(device?.downloadMb || 14.8);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(24 * 3600 - 120);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Live traffic simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloadSpeed(+(24 + Math.random() * 8).toFixed(1));
      setUploadSpeed(+(10 + Math.random() * 4).toFixed(1));
      setDataUsedMb(prev => +(prev + 0.3).toFixed(1));
      setTimeRemainingSeconds(prev => Math.max(0, prev - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <Wifi className="w-9 h-9 text-white stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Internet Access Authorized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              You are Online!
            </h1>
            <p className="font-bangla text-emerald-100 text-sm">
              আপনার ওয়াইফাই সংযোগ সক্রিয় হয়েছে। নিরবচ্ছিন্ন ইন্টারনেট উপভোগ করুন।
            </p>
          </div>
        </div>

        {/* Speed & Live Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-100 font-medium flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-emerald-300" />
              <span>Download Speed</span>
            </span>
            <div className="text-xl font-mono font-bold mt-1 tabular-nums">
              {downloadSpeed} <span className="text-xs font-normal">Mbps</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-100 font-medium flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-emerald-300" />
              <span>Upload Speed</span>
            </span>
            <div className="text-xl font-mono font-bold mt-1 tabular-nums">
              {uploadSpeed} <span className="text-xs font-normal">Mbps</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-100 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-300" />
              <span>Remaining Time</span>
            </span>
            <div className="text-lg font-mono font-bold mt-1 tabular-nums">
              {formatCountdown(timeRemainingSeconds)}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-100 font-medium flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-300" />
              <span>Session Data</span>
            </span>
            <div className="text-xl font-mono font-bold mt-1 tabular-nums">
              {dataUsedMb} <span className="text-xs font-normal">MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network & Session Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Connection & Device Telemetry</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">BDIX Connected</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block mb-0.5">Assigned IP Address:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{device?.ip || deviceIp}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block mb-0.5">Device Token / ID:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{device?.mac || deviceMac}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block mb-0.5">Hotspot Gateway / DNS:</span>
            <span className="font-mono font-medium text-slate-700">Online Gateway (Cloudflare 1.1.1.1)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block mb-0.5">Active Package:</span>
            <span className="font-semibold text-emerald-700">
              {device?.planName || (request ? `${request.method} Verified (৳${request.amount})` : 'Authorized Pass')}
            </span>
          </div>
        </div>

        {/* Quick Web Test Simulation */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Simulate Internet Connectivity Test:
          </p>
          <div className="flex flex-wrap gap-2">
            {['Google Search (0.1s)', 'YouTube HD 1080p', 'Prothom Alo News', 'Fast.com Speed Test'].map((site) => (
              <button
                key={site}
                onClick={() => {
                  setActiveTest(site);
                  setTimeout(() => setActiveTest(null), 3000);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{site}</span>
              </button>
            ))}
          </div>

          {activeTest && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Simulated high-speed packet transfer to <strong>{activeTest}</strong> succeeded with 0% packet loss (Ping: 11ms).</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onDisconnect}
            className="px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Hotspot</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Admin Console</span>
          </button>
        </div>
      </div>
    </div>
  );
};

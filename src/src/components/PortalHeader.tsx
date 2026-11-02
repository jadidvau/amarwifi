import React from 'react';
import { Wifi, Zap, Shield, MapPin, Radio } from 'lucide-react';
import type { PortalSettings } from '../types.ts';

interface PortalHeaderProps {
  settings: PortalSettings;
  deviceIp: string;
  deviceMac: string;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  settings,
  deviceIp,
  deviceMac,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800">
      {/* Background Hero Banner */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/dhaka_wifi_cafe_1793639423640.jpg"
          alt="Dhaka Wi-Fi Cafe Hub"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-25 filter brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Unboxed metadata line */}
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Hotspot Active</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {settings.locationName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
            <a
              href="https://wa.me/8801980000601"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-sans font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 transition-colors"
            >
              <span>WhatsApp Support:</span>
              <span className="font-mono text-white">01980000601</span>
            </a>
            <span className="text-slate-300 font-semibold bg-slate-800/80 px-2 py-0.5 rounded">
              IP: {deviceIp}
            </span>
            <span className="text-slate-400 hidden md:inline">
              ID: {deviceMac}
            </span>
          </div>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2" style={{ textWrap: 'balance' }}>
            {settings.hotspotName}
          </h1>
          <p className="font-bangla text-base sm:text-lg text-emerald-300 font-medium mb-3">
            স্বাগতম! দ্রুতগতির আনলিমিটেড ওয়াইফাই ইন্টারনেটে যুক্ত হতে প্যাকেজ রিচার্জ করুন
          </p>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Get instant high-speed broadband access for only <strong className="text-white font-semibold">৳{settings.fee50} (Daily)</strong> or <strong className="text-white font-semibold">৳{settings.fee100} (Weekly Unlimited)</strong>. Pay conveniently using <span className="text-pink-400 font-medium">bKash</span> or <span className="text-amber-400 font-medium">Nagad</span>.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bangla">দ্রুত সক্রিয়</p>
              <p className="text-xs font-semibold text-white">Instant 2-Min Approval</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bangla">হাই-স্পিড অপটিক্যাল ফাইবার</p>
              <p className="text-xs font-semibold text-white">Up to 30 Mbps Speed</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bangla">নিরাপদ ব্রাউজিং</p>
              <p className="text-xs font-semibold text-white">Encrypted & Secure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

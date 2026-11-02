import React from 'react';
import { Wifi, ShieldCheck, Smartphone, Laptop } from 'lucide-react';

interface NavbarProps {
  currentView: 'portal' | 'admin';
  onNavigate: (view: 'portal' | 'admin') => void;
  pendingCount?: number;
  isOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  pendingCount = 0,
  isOnline = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single element wordmark */}
          <div 
            onClick={() => onNavigate('portal')}
            className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Wifi className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>AmarWifi</span>
                <span className="font-bangla text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">হটস্পট</span>
              </div>
            </div>
          </div>

          {/* Zone 2: Concise navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('portal')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                currentView === 'portal' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Captive Portal
            </button>
            <a 
              href="#packages" 
              onClick={(e) => {
                if (currentView !== 'portal') {
                  e.preventDefault();
                  onNavigate('portal');
                }
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Internet Packages
            </a>
            <a 
              href="#payment-instructions" 
              onClick={(e) => {
                if (currentView !== 'portal') {
                  e.preventDefault();
                  onNavigate('portal');
                }
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              bKash / Nagad Guide
            </a>
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 ${
                currentView === 'admin' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              <span>Admin Console</span>
              {pendingCount > 0 && (
                <span className="text-[11px] font-mono font-semibold bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {currentView === 'portal' ? (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Admin Login</span>
                {pendingCount > 0 && (
                  <span className="font-mono text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">
                    {pendingCount} new
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => onNavigate('portal')}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Switch to User Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

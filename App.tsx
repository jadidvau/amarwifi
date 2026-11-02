import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { PortalHeader } from './components/PortalHeader.tsx';
import { PlanSelector } from './components/PlanSelector.tsx';
import { MfsPaymentBox } from './components/MfsPaymentBox.tsx';
import { PaymentForm } from './components/PaymentForm.tsx';
import { WaitingScreen } from './components/WaitingScreen.tsx';
import { OnlineScreen } from './components/OnlineScreen.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { 
  getOrCreateClientDevice, 
  refreshClientRealIp,
  resetClientDevice, 
  getSession, 
  submitPayment, 
  getAdminStats,
  type ClientDeviceInfo 
} from './lib/api.ts';
import type { 
  HotspotPlan, 
  HotspotRequest, 
  PortalSettings, 
  PaymentMethod, 
  ConnectedDevice 
} from './types.ts';
import { Wifi, AlertCircle, RefreshCw, Smartphone, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'portal' | 'admin'>('portal');
  const [clientDevice, setClientDevice] = useState<ClientDeviceInfo>(getOrCreateClientDevice);
  const [userState, setUserState] = useState<'portal' | 'pending' | 'online' | 'blocked'>('portal');
  
  const [selectedPlanId, setSelectedPlanId] = useState<'plan_50' | 'plan_100'>('plan_50');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bKash');
  
  const [activeRequest, setActiveRequest] = useState<HotspotRequest | null>(null);
  const [currentDevice, setCurrentDevice] = useState<ConnectedDevice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  const [settings, setSettings] = useState<PortalSettings>({
    hotspotName: 'AmarWifi Hotspot',
    hotspotSubname: 'ধানমন্ডি জোন ৪ · ঢাকা',
    locationName: 'Dhanmondi Metro Cafe & Coworking Hub, Dhaka',
    bkashNumber: '01904031478',
    nagadNumber: '01904031478',
    supportPhone: '01980000601',
    fee50: 50,
    fee100: 100,
  });

  const [plans, setPlans] = useState<HotspotPlan[]>([
    {
      id: 'plan_50',
      name: '24 Hours Pass',
      nameBn: '২৪ ঘণ্টার পাস',
      price: 50,
      duration: '24 Hours',
      durationBn: '১ দিন (২৪ ঘণ্টা)',
      dataLimit: '5 GB High-Speed',
      speed: '15 Mbps',
      features: ['15 Mbps Unlimited Speed', '5 GB High-Speed Data', 'Instant Activation', 'YouTube & Social Media HD'],
    },
    {
      id: 'plan_100',
      name: '7 Days Unlimited',
      nameBn: '৭ দিনের আনলিমিটেড পাস',
      price: 100,
      duration: '7 Days',
      durationBn: '৭ দিন সম্পূর্ণ আনলিমিটেড',
      dataLimit: 'Unlimited Data',
      speed: '30 Mbps',
      badge: 'Best Value / সেরা অফার',
      features: ['30 Mbps Ultra-Fast Speed', 'No Daily FUP Limit', 'Continuous 7 Days Validity', 'Low Ping Gaming & 4K Streaming'],
    },
  ]);

  // Dynamically resolve real public IP on mount
  useEffect(() => {
    refreshClientRealIp().then((updated) => {
      setClientDevice(updated);
    });
  }, []);

  // Sync session with backend or local store
  const refreshSession = useCallback(async () => {
    try {
      const data = await getSession(clientDevice.mac, clientDevice.ip);
      if (data) {
        if (data.settings) setSettings(data.settings);
        if (data.plans && data.plans.length > 0) setPlans(data.plans);
        if (data.userState) setUserState(data.userState);
        if (data.device !== undefined) setCurrentDevice(data.device);
        if (data.activeRequest) {
          setActiveRequest(data.activeRequest);
        }
      }

      // Also get pending requests count for badge
      const stats = await getAdminStats();
      if (stats && typeof stats.pendingRequests === 'number') {
        setPendingRequestsCount(stats.pendingRequests);
      }
    } catch (err) {
      // Quiet fallback: local state remains operational
      console.warn('[AmarWifi] Non-critical session sync notice:', err);
    }
  }, [clientDevice]);

  useEffect(() => {
    refreshSession();
    // Periodic refresh
    const interval = setInterval(refreshSession, 3000);
    return () => clearInterval(interval);
  }, [refreshSession]);

  // Handle payment submission
  const handlePaymentSubmit = async (formData: {
    method: PaymentMethod;
    planId: string;
    senderPhone: string;
    trxId: string;
    deviceIp: string;
    deviceMac: string;
    deviceName: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await submitPayment(formData);
      if (res.success) {
        setActiveRequest(res.request);
        setUserState('pending');
        // Refresh admin stats to update badge
        const stats = await getAdminStats();
        setPendingRequestsCount(stats.pendingRequests);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeviceApproved = () => {
    setUserState('online');
    refreshSession();
  };

  const handleDisconnect = () => {
    setUserState('portal');
    setActiveRequest(null);
  };

  const handleSimulateNewDevice = () => {
    const newDev = resetClientDevice();
    setClientDevice(newDev);
    setUserState('portal');
    setActiveRequest(null);
    setCurrentDevice(null);
  };

  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        pendingCount={pendingRequestsCount}
        isOnline={userState === 'online'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'admin' ? (
          /* Admin View */
          adminToken ? (
            <AdminDashboard
              onLogout={() => setAdminToken(null)}
              onSwitchToPortal={() => setCurrentView('portal')}
              onDeviceApprovedNotice={(mac) => {
                if (mac.toLowerCase() === clientDevice.mac.toLowerCase()) {
                  setUserState('online');
                }
              }}
            />
          ) : (
            <AdminLogin
              onSuccess={(token) => setAdminToken(token)}
              onBackToPortal={() => setCurrentView('portal')}
            />
          )
        ) : (
          /* User Captive Portal Views */
          userState === 'blocked' ? (
            /* Blocked Device Screen */
            <div className="max-w-md mx-auto rounded-2xl bg-white border border-rose-200 p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Access Temporarily Restricted
              </h2>
              <p className="font-bangla text-sm text-rose-700 font-medium mb-3">
                আপনার ডিভাইসের ইন্টারনেট অ্যাক্সেস বন্ধ রয়েছে
              </p>
              <p className="text-xs text-slate-500 mb-6">
                Your device ({clientDevice.mac}) is set to BLOCKED in the hotspot controller. Please contact the administrator or verify your package.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Open Admin Dashboard to Unblock
                </button>
                <button
                  onClick={handleSimulateNewDevice}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Simulate New Client Connection
                </button>
              </div>
            </div>
          ) : userState === 'online' ? (
            /* Connected / Online Screen */
            <OnlineScreen
              device={currentDevice}
              request={activeRequest}
              settings={settings}
              deviceMac={clientDevice.mac}
              deviceIp={clientDevice.ip}
              onDisconnect={handleDisconnect}
              onOpenAdmin={() => setCurrentView('admin')}
            />
          ) : userState === 'pending' && activeRequest ? (
            /* Waiting / Pending Screen */
            <WaitingScreen
              request={activeRequest}
              deviceMac={clientDevice.mac}
              onApproved={handleDeviceApproved}
              onEditOrRetry={() => setUserState('portal')}
              onOpenAdmin={() => setCurrentView('admin')}
            />
          ) : (
            /* Standard Captive Portal Landing */
            <div className="space-y-8">
              {/* Portal Header */}
              <PortalHeader
                settings={settings}
                deviceIp={clientDevice.ip}
                deviceMac={clientDevice.mac}
              />

              {/* Package Selector */}
              <PlanSelector
                plans={plans}
                selectedPlanId={selectedPlanId}
                onSelectPlan={(id) => setSelectedPlanId(id)}
              />

              {/* Split Grid: Payment Instructions + Submission Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <MfsPaymentBox
                  selectedMethod={selectedMethod}
                  onSelectMethod={(method) => setSelectedMethod(method)}
                  settings={settings}
                  amount={activePlan.price}
                />

                <PaymentForm
                  selectedMethod={selectedMethod}
                  selectedPlan={activePlan}
                  deviceIp={clientDevice.ip}
                  deviceMac={clientDevice.mac}
                  deviceName={clientDevice.name}
                  onSubmit={handlePaymentSubmit}
                  isLoading={isSubmitting}
                  onSelectMethod={(m) => setSelectedMethod(m)}
                />
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">AmarWifi Broadband Hotspot</span>
            <span aria-hidden="true">·</span>
            <span>Licensed ISP Partner</span>
            <span aria-hidden="true">·</span>
            <span>Dhaka, Bangladesh</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://wa.me/8801980000601"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors font-medium border border-emerald-200"
            >
              <span>Customer Support (WhatsApp):</span>
              <strong className="font-mono text-emerald-900 font-bold">01980000601</strong>
            </a>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentView(currentView === 'portal' ? 'admin' : 'portal')}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              {currentView === 'portal' ? 'Admin Login' : 'User Portal'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

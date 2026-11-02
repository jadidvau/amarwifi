import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  CheckCircle, 
  Ban, 
  Clock, 
  Users, 
  Search, 
  Plus, 
  Check, 
  X, 
  RotateCw, 
  Phone, 
  Hash, 
  Laptop, 
  Smartphone, 
  Filter, 
  Settings, 
  SlidersHorizontal, 
  LogOut, 
  Radio, 
  ShieldCheck, 
  DollarSign, 
  AlertTriangle, 
  ChevronRight,
  Trash2
} from 'lucide-react';
import type { 
  ConnectedDevice, 
  HotspotRequest, 
  AdminStats, 
  PortalSettings, 
  AuditLog 
} from '../types.ts';
import { 
  getAdminStats, 
  getAdminDevices, 
  getAdminRequests, 
  toggleDeviceAccess, 
  approveRequest, 
  rejectRequest, 
  addDevice, 
  deleteDevice, 
  getAdminLogs, 
  updateSettings, 
  getPortalSettings,
  resetDemoData 
} from '../lib/api.ts';

interface AdminDashboardProps {
  onLogout: () => void;
  onSwitchToPortal: () => void;
  onDeviceApprovedNotice?: (mac: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onSwitchToPortal,
  onDeviceApprovedNotice,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'devices' | 'settings' | 'logs'>('requests');
  const [stats, setStats] = useState<AdminStats>({
    totalOnline: 0,
    allowed: 0,
    blocked: 0,
    pendingRequests: 0,
    totalRevenue: 0,
    totalDevices: 0,
  });
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [requests, setRequests] = useState<HotspotRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PortalSettings | null>(null);
  
  // Filter & Search states
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'allowed' | 'blocked' | 'online'>('all');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Modal states
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({
    name: '',
    ip: '',
    mac: '',
    connectionType: '5 GHz' as '2.4 GHz' | '5 GHz' | 'Wi-Fi 6',
  });
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  
  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<PortalSettings>>({});
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data
  const loadData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [s, devList, reqList, logList, portalSettings] = await Promise.all([
        getAdminStats(),
        getAdminDevices(),
        getAdminRequests(),
        getAdminLogs(),
        getPortalSettings(),
      ]);
      setStats(s);
      setDevices(devList);
      setRequests(reqList);
      setLogs(logList);
      if (portalSettings) {
        setSettings(portalSettings);
        setSettingsForm(portalSettings);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 3 seconds to catch live user submissions
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [adminNotice, setAdminNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setAdminNotice({ message, type });
    setTimeout(() => setAdminNotice(null), 3500);
  };

  // Approve action
  const handleApprove = async (id: string, mac: string) => {
    try {
      const res = await approveRequest(id);
      if (res.success) {
        showNotice(`Approved request for ${mac}. Internet granted!`, 'success');
        if (onDeviceApprovedNotice) {
          onDeviceApprovedNotice(mac);
        }
        await loadData(true);
      }
    } catch (err: any) {
      showNotice(err.message || 'Error approving request', 'error');
    }
  };

  // Reject action
  const handleRejectConfirm = async () => {
    if (!rejectingRequestId) return;
    try {
      await rejectRequest(rejectingRequestId, rejectReasonInput || 'Payment not found in statement');
      setRejectingRequestId(null);
      setRejectReasonInput('');
      showNotice('Payment request rejected.', 'error');
      await loadData(true);
    } catch (err: any) {
      showNotice(err.message || 'Error rejecting request', 'error');
    }
  };

  // Toggle Internet ON/OFF for a device
  const handleToggleDevice = async (device: ConnectedDevice) => {
    try {
      const targetState = device.accessStatus === 'allowed' ? false : true;
      const res = await toggleDeviceAccess(device.id, device.mac, targetState);
      if (res.success) {
        setDevices(prev => prev.map(d => d.id === device.id ? res.device : d));
        setStats(res.stats);
        showNotice(`${device.name}: Internet access ${targetState ? 'ALLOWED' : 'BLOCKED'}`, targetState ? 'success' : 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'Failed to toggle device', 'error');
    }
  };

  // Handle Add Device
  const handleAddDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceData.mac || !newDeviceData.ip) return;
    try {
      await addDevice({
        name: newDeviceData.name || 'Admin Authorized Device',
        ip: newDeviceData.ip,
        mac: newDeviceData.mac,
        connectionType: newDeviceData.connectionType,
        accessStatus: 'allowed',
      });
      setIsAddDeviceOpen(false);
      setNewDeviceData({
        name: '',
        ip: '',
        mac: '',
        connectionType: '5 GHz',
      });
      showNotice('Device successfully whitelisted and added.', 'success');
      await loadData(true);
    } catch (err: any) {
      showNotice(err.message || 'Failed to add device', 'error');
    }
  };

  // Handle Delete Device
  const handleDeleteDevice = async (id: string) => {
    try {
      await deleteDevice(id);
      showNotice('Device removed from controller.', 'success');
      await loadData(true);
    } catch (err: any) {
      showNotice(err.message || 'Failed to delete device', 'error');
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateSettings(settingsForm);
      if (res.success) {
        setSettings(res.settings);
        showNotice('Portal settings updated successfully.', 'success');
      }
    } catch (err: any) {
      showNotice(err.message || 'Failed to save settings', 'error');
    }
  };

  // Filtered devices
  const filteredDevices = devices.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.ip.includes(deviceSearch) ||
      d.mac.toLowerCase().includes(deviceSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (deviceFilter === 'allowed') return d.accessStatus === 'allowed';
    if (deviceFilter === 'blocked') return d.accessStatus === 'blocked';
    if (deviceFilter === 'online') return d.status === 'online';
    return true;
  });

  // Filtered requests
  const filteredRequests = requests.filter(r => {
    if (requestFilter === 'pending') return r.status === 'pending';
    if (requestFilter === 'approved') return r.status === 'approved';
    if (requestFilter === 'rejected') return r.status === 'rejected';
    return true;
  });

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Toast Notice Banner */}
      {adminNotice && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between border shadow-xs transition-all ${
            adminNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{adminNotice.message}</span>
          <button
            onClick={() => setAdminNotice(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
          >
            鉁�
          </button>
        </div>
      )}

      {/* Top Admin Sub-bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Hotspot Gateway Administration
            </h1>
            <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
              v2.4 Core
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dhanmondi Hub Router 路 Local DHCP & MFS Verification Console
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh data"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={onSwitchToPortal}
            className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            Test User Portal
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards: Total Online, Allowed, Blocked, Pending, Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Online */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Online</span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {stats.totalOnline}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active with internet</p>
        </div>

        {/* Allowed Devices */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Allowed Devices</span>
            <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {stats.allowed}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Authorized in firewall</p>
        </div>

        {/* Blocked Devices */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Blocked Devices</span>
            <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
              <Ban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {stats.blocked}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Access disabled</p>
        </div>

        {/* Hotspot Pending Requests */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Pending Requests</span>
            <div className="w-6 h-6 rounded-md bg-amber-200 text-amber-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-950 mt-2 tabular-nums">
            {pendingRequestsCount}
          </div>
          <p className="text-[11px] text-amber-800 mt-0.5">Awaiting verification</p>
        </div>

        {/* Total Revenue */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Revenue</span>
            <span className="text-xs font-bold font-mono text-slate-500">BDT</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            <span>{stats.totalRevenue}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">From bKash & Nagad</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Hotspot Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="font-mono text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'devices'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Connected Devices</span>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
              {devices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>MFS Accounts & Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* TAB 1: HOTSPOT REQUESTS SECTION */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                User Payment Verification Queue
              </h2>
              <p className="text-xs text-slate-500">
                Verify TrxID on your bKash/Nagad merchant app and approve to grant instant Wi-Fi access.
              </p>
            </div>

            {/* Segmented Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs self-start sm:self-auto">
              <button
                onClick={() => setRequestFilter('pending')}
                className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                  requestFilter === 'pending'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingRequestsCount})
              </button>
              <button
                onClick={() => setRequestFilter('approved')}
                className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                  requestFilter === 'approved'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setRequestFilter('rejected')}
                className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                  requestFilter === 'rejected'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setRequestFilter('all')}
                className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
                  requestFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800">No requests in this view</p>
              <p className="text-xs text-slate-500 mt-1">
                When a user connects to Wi-Fi and submits their bKash/Nagad TrxID, it will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';

                return (
                  <div
                    key={req.id}
                    className={`rounded-xl border p-4 sm:p-5 transition-all ${
                      isPending
                        ? 'bg-white border-amber-300 ring-1 ring-amber-400/20 shadow-xs'
                        : isApproved
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50/80 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: User & Payment Details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Method Badge */}
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-bold text-white flex items-center gap-1.5 ${
                              req.method === 'bKash' ? 'bg-[#D12053]' : 'bg-[#F7941D]'
                            }`}
                          >
                            <span>{req.method}</span>
                            <span className="font-mono">唰硔req.amount}</span>
                          </span>

                          {/* Status */}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {req.status.toUpperCase()}
                          </span>

                          {/* Plan */}
                          <span className="text-xs text-slate-500 font-medium">
                            {req.planId === 'plan_50' ? '24 Hours Pass' : '7 Days Unlimited'}
                          </span>

                          <span aria-hidden="true" className="text-slate-300">路</span>

                          <span className="text-xs text-slate-500 font-mono tabular-nums">
                            {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        {/* Transaction ID & Sender Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">Sender Number:</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {req.senderPhone}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">TrxID:</span>
                            <span className="font-mono font-extrabold text-slate-900 text-sm tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {req.trxId}
                            </span>
                          </div>
                        </div>

                        {/* Device Info */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono tabular-nums">
                          <span>Device: <strong className="text-slate-800">{req.deviceName || 'Hotspot Client'}</strong></span>
                          <span>IP: <strong className="text-slate-800">{req.deviceIp}</strong></span>
                          <span>MAC: <strong className="text-slate-800">{req.deviceMac}</strong></span>
                        </div>

                        {isRejected && req.rejectReason && (
                          <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                            Reason: {req.rejectReason}
                          </div>
                        )}
                      </div>

                      {/* Right: Prominent Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleApprove(req.id, req.deviceMac)}
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>Approve (唳呧Θ唰佮Ξ唰嬥Ζ唳�)</span>
                            </button>

                            <button
                              onClick={() => {
                                setRejectingRequestId(req.id);
                                setRejectReasonInput('Payment TrxID not found in bKash/Nagad statement');
                              }}
                              className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : isApproved ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Internet Active</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-600 font-medium bg-rose-50 px-3 py-1.5 rounded-lg">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONNECTED DEVICES SECTION */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Connected Devices & Access Control
              </h2>
              <p className="text-xs text-slate-500">
                Use the ON/OFF switches to toggle internet access instantaneously per device MAC or IP.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddDeviceOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Device Manually</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by IP, MAC address, or device name..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-sans bg-white"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs shrink-0">
              <button
                onClick={() => setDeviceFilter('all')}
                className={`px-2.5 py-1 font-medium rounded-md transition-all cursor-pointer ${
                  deviceFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                All ({devices.length})
              </button>
              <button
                onClick={() => setDeviceFilter('allowed')}
                className={`px-2.5 py-1 font-medium rounded-md transition-all cursor-pointer ${
                  deviceFilter === 'allowed' ? 'bg-white text-emerald-800 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Allowed ({stats.allowed})
              </button>
              <button
                onClick={() => setDeviceFilter('blocked')}
                className={`px-2.5 py-1 font-medium rounded-md transition-all cursor-pointer ${
                  deviceFilter === 'blocked' ? 'bg-white text-rose-800 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Blocked ({stats.blocked})
              </button>
              <button
                onClick={() => setDeviceFilter('online')}
                className={`px-2.5 py-1 font-medium rounded-md transition-all cursor-pointer ${
                  deviceFilter === 'online' ? 'bg-white text-teal-800 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Online ({stats.totalOnline})
              </button>
            </div>
          </div>

          {/* Devices Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Device Name</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">MAC Address</th>
                    <th className="py-3 px-4">Band & Type</th>
                    <th className="py-3 px-4 text-right">Data Usage</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Internet Access</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No devices match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((dev) => {
                      const isAllowed = dev.accessStatus === 'allowed';
                      return (
                        <tr key={dev.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Device Name */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {dev.name.toLowerCase().includes('phone') || dev.name.toLowerCase().includes('samsung') || dev.name.toLowerCase().includes('iphone') ? (
                                <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span>{dev.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {dev.planName || 'Standard DHCP'}
                            </span>
                          </td>

                          {/* IP Address */}
                          <td className="py-3 px-4 font-mono font-medium text-slate-800 tabular-nums">
                            {dev.ip}
                          </td>

                          {/* MAC Address */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                            {dev.mac}
                          </td>

                          {/* Connection Type */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {dev.connectionType}
                            </span>
                          </td>

                          {/* Data Usage */}
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                            <div>鈫� {(dev.downloadMb).toFixed(1)} MB</div>
                            <div className="text-[10px] text-slate-400">鈫� {(dev.uploadMb).toFixed(1)} MB</div>
                          </td>

                          {/* Online Status */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                dev.status === 'online'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${dev.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span>{dev.status}</span>
                            </span>
                          </td>

                          {/* ON/OFF TOGGLE SWITCH FOR INTERNET ACCESS */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleDevice(dev)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                isAllowed ? 'bg-emerald-600' : 'bg-rose-500'
                              }`}
                              title={isAllowed ? 'Internet access is ON (click to Block)' : 'Internet access is BLOCKED (click to Allow)'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isAllowed ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="block text-[10px] font-semibold mt-0.5 font-mono">
                              {isAllowed ? (
                                <span className="text-emerald-700">ON (Allowed)</span>
                              ) : (
                                <span className="text-rose-700">OFF (Blocked)</span>
                              )}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteDevice(dev.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete from list"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & MFS NUMBERS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Hotspot Configuration & Payment Receivers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize the bKash & Nagad numbers shown on the user captive portal, along with package fees.
            </p>
          </div>

          {settingsSavedToast && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Portal settings updated successfully in real time!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hotspot Name
                </label>
                <input
                  type="text"
                  value={settingsForm.hotspotName || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, hotspotName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location / Zone
                </label>
                <input
                  type="text"
                  value={settingsForm.locationName || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, locationName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D12053]" />
                  <span>bKash Personal / Send Money Number</span>
                </label>
                <input
                  type="text"
                  value={settingsForm.bkashNumber || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bkashNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F7941D]" />
                  <span>Nagad Personal / Send Money Number</span>
                </label>
                <input
                  type="text"
                  value={settingsForm.nagadNumber || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, nagadNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Pass Fee (唰� BDT)
                </label>
                <input
                  type="number"
                  value={settingsForm.fee50 || 50}
                  onChange={(e) => setSettingsForm({ ...settingsForm, fee50: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Weekly Pass Fee (唰� BDT)
                </label>
                <input
                  type="number"
                  value={settingsForm.fee100 || 100}
                  onChange={(e) => setSettingsForm({ ...settingsForm, fee100: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Hotspot Controller Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Timestamped records of payment verifications, device approvals, and toggle events.
              </p>
            </div>
            <button
              onClick={() => loadData(false)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        log.type === 'success'
                          ? 'text-emerald-700'
                          : log.type === 'warning'
                          ? 'text-amber-700'
                          : log.type === 'danger'
                          ? 'text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 font-sans">{log.details}</p>
                </div>
                <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Reject Request Dialog */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reject Payment Submission
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Provide a reason so the user knows why their TrxID could not be validated.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="e.g. TrxID not found in bKash/Nagad statement or incorrect amount"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingRequestId(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Device Manually */}
      {isAddDeviceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Whitelist / Add Device Manually
                </h3>
                <p className="text-xs text-slate-500">
                  Directly grant internet access to a specific device MAC/IP.
                </p>
              </div>
              <button
                onClick={() => setIsAddDeviceOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeviceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Device Label / Owner Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff iPad, Manager Laptop"
                  value={newDeviceData.name}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  MAC Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEV-89A1-BC02 or MAC Address"
                  value={newDeviceData.mac}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, mac: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 103.205.x.x or IP address"
                  value={newDeviceData.ip}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, ip: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Connection Band
                </label>
                <select
                  value={newDeviceData.connectionType}
                  onChange={(e: any) => setNewDeviceData({ ...newDeviceData, connectionType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="5 GHz">5 GHz High-Performance</option>
                  <option value="2.4 GHz">2.4 GHz Long-Range</option>
                  <option value="Wi-Fi 6">Wi-Fi 6 802.11ax</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDeviceOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Authorize Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

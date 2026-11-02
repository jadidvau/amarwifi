import type { 
  HotspotPlan, 
  HotspotRequest, 
  ConnectedDevice, 
  PortalSettings, 
  AdminStats, 
  AuditLog 
} from '../types.ts';

// LocalStorage Keys for client-side state on static hosts (e.g. Netlify)
const DEVICE_KEY = 'amarwifi_client_device';
const KEY_REQUESTS = 'amarwifi_hotspot_requests';
const KEY_DEVICES = 'amarwifi_connected_devices';
const KEY_SETTINGS = 'amarwifi_portal_settings';
const KEY_LOGS = 'amarwifi_audit_logs';

export interface ClientDeviceInfo {
  mac: string; // Persistent Device Fingerprint Token
  ip: string;  // Dynamic Public / Local IP
  name: string;
}

export const DEFAULT_SETTINGS: PortalSettings = {
  hotspotName: 'AmarWifi Hotspot',
  hotspotSubname: 'ধানমন্ডি জোন ৪ · ঢাকা',
  locationName: 'Dhanmondi Metro Cafe & Coworking Hub, Dhaka',
  bkashNumber: '01904031478',
  nagadNumber: '01904031478',
  supportPhone: '01980000601',
  fee50: 50,
  fee100: 100,
  autoApproveDemo: false,
};

export const DEFAULT_PLANS: HotspotPlan[] = [
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
];

// ----------------------------------------------------
// Dynamic Public IP & Device Fingerprint Detection
// ----------------------------------------------------

/**
 * Dynamically fetches the user's real public IP from public IP services
 */
export async function fetchPublicIp(): Promise<string> {
  if (typeof window === 'undefined') return '127.0.0.1';

  const services = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
    'https://icanhazip.com',
  ];

  for (const url of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        if (url.includes('json')) {
          const data = await res.json();
          if (data && data.ip && typeof data.ip === 'string') {
            return data.ip.trim();
          }
        } else {
          const text = await res.text();
          if (text && text.trim().length >= 7 && !text.includes('<')) {
            return text.trim();
          }
        }
      }
    } catch {
      // Continue to next service
    }
  }

  return 'Local Network Device';
}

/**
 * Detect client friendly name from user agent
 */
function detectDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Connected Client';
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'Apple iPhone';
  if (/iPad/i.test(ua)) return 'Apple iPad';
  if (/Android/i.test(ua)) return 'Android Device';
  if (/Mac/i.test(ua)) return 'MacBook / Mac Device';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux Workstation';
  return 'Connected Client';
}

/**
 * Persistent device fingerprint token (replacing fake router MAC address generator)
 */
function generateDeviceFingerprintToken(): string {
  const hexPart = () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase();
  return `DEV-${hexPart()}-${hexPart()}`;
}

export function getOrCreateClientDevice(): ClientDeviceInfo {
  if (typeof window === 'undefined') {
    return { mac: 'DEV-CLIENT', ip: '127.0.0.1', name: 'Connected Client' };
  }

  const stored = localStorage.getItem(DEVICE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.mac) {
        // Upgrade legacy mock MAC format if present
        if (parsed.mac.startsWith('BC:D0:74') || parsed.ip?.startsWith('192.168.88')) {
          parsed.mac = generateDeviceFingerprintToken();
          parsed.ip = 'Detecting IP...';
          localStorage.setItem(DEVICE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  const newDevice: ClientDeviceInfo = {
    mac: generateDeviceFingerprintToken(),
    ip: 'Detecting IP...',
    name: detectDeviceName(),
  };

  localStorage.setItem(DEVICE_KEY, JSON.stringify(newDevice));
  return newDevice;
}

export async function refreshClientRealIp(): Promise<ClientDeviceInfo> {
  const current = getOrCreateClientDevice();
  const realIp = await fetchPublicIp();
  const updated: ClientDeviceInfo = {
    ...current,
    ip: realIp,
  };
  localStorage.setItem(DEVICE_KEY, JSON.stringify(updated));
  return updated;
}

export function resetClientDevice(): ClientDeviceInfo {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(DEVICE_KEY);
  }
  return getOrCreateClientDevice();
}

// ----------------------------------------------------
// Client-Side LocalStorage Store for Netlify & Static Hosting
// ----------------------------------------------------

function getStoredSettings(): PortalSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(KEY_SETTINGS);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveStoredSettings(s: PortalSettings) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
  }
}

function getStoredRequests(): HotspotRequest[] {
  if (typeof localStorage === 'undefined') return [];
  const stored = localStorage.getItem(KEY_REQUESTS);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveStoredRequests(reqs: HotspotRequest[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_REQUESTS, JSON.stringify(reqs));
  }
}

function getStoredDevices(): ConnectedDevice[] {
  if (typeof localStorage === 'undefined') return [];
  const stored = localStorage.getItem(KEY_DEVICES);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveStoredDevices(devs: ConnectedDevice[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_DEVICES, JSON.stringify(devs));
  }
}

function getStoredLogs(): AuditLog[] {
  if (typeof localStorage === 'undefined') return [];
  const stored = localStorage.getItem(KEY_LOGS);
  if (!stored) {
    return [
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        action: 'System Online',
        details: 'AmarWifi Hotspot Gateway initialized. bKash/Nagad: 01904031478 | WhatsApp: 01980000601',
        type: 'info',
      },
    ];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function appendStoredLog(log: AuditLog) {
  const logs = getStoredLogs();
  logs.unshift(log);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_LOGS, JSON.stringify(logs.slice(0, 50)));
  }
}

function computeLocalStats(): AdminStats {
  const devices = getStoredDevices();
  const requests = getStoredRequests();
  const onlineAllowed = devices.filter(d => d.status === 'online' && d.accessStatus === 'allowed').length;
  const totalAllowed = devices.filter(d => d.accessStatus === 'allowed').length;
  const totalBlocked = devices.filter(d => d.accessStatus === 'blocked').length;
  const pending = requests.filter(r => r.status === 'pending').length;
  const approvedTotal = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  return {
    totalOnline: onlineAllowed,
    allowed: totalAllowed,
    blocked: totalBlocked,
    pendingRequests: pending,
    totalRevenue: approvedTotal,
    totalDevices: devices.length,
  };
}

// ----------------------------------------------------
// Safe JSON Fetcher (Detects Netlify / HTML error responses)
// ----------------------------------------------------

async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    // On Netlify / static hosts, unknown API routes return index.html (text/html) with 200 OK.
    // If it's not application/json or response starts with '<', return null to trigger local fallback.
    if (!res.ok || !contentType.toLowerCase().includes('application/json')) {
      return null;
    }

    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return null;
    }

    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// Universal API Layer with Seamless Static Host Fallback
// ----------------------------------------------------

export async function getSession(mac: string, ip: string) {
  const remote = await safeFetchJson<{
    deviceIp: string;
    deviceMac: string;
    deviceName: string;
    userState: 'portal' | 'pending' | 'online' | 'blocked';
    device: ConnectedDevice | null;
    activeRequest: HotspotRequest | null;
    plans: HotspotPlan[];
    settings: PortalSettings;
  }>(`/api/session?mac=${encodeURIComponent(mac)}&ip=${encodeURIComponent(ip)}`, {
    headers: { 'x-device-mac': mac },
  });

  if (remote) return remote;

  // LocalStorage Fallback for Netlify / Static hosting
  const devices = getStoredDevices();
  const requests = getStoredRequests();
  const settings = getStoredSettings();

  const existingDevice = devices.find(
    d => d.mac.toLowerCase() === mac.toLowerCase() || (ip !== 'Detecting IP...' && d.ip === ip)
  );

  const pendingOrLatestRequest = requests
    .filter(r => r.deviceMac.toLowerCase() === mac.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  let userState: 'portal' | 'pending' | 'online' | 'blocked' = 'portal';

  if (existingDevice) {
    if (existingDevice.accessStatus === 'blocked') {
      userState = 'blocked';
    } else if (existingDevice.accessStatus === 'allowed' && existingDevice.status === 'online') {
      userState = 'online';
    }
  } else if (pendingOrLatestRequest) {
    if (pendingOrLatestRequest.status === 'pending') {
      userState = 'pending';
    } else if (pendingOrLatestRequest.status === 'approved') {
      userState = 'online';
    }
  }

  return {
    deviceIp: ip,
    deviceMac: mac,
    deviceName: existingDevice ? existingDevice.name : detectDeviceName(),
    userState,
    device: existingDevice || null,
    activeRequest: pendingOrLatestRequest || null,
    plans: DEFAULT_PLANS,
    settings,
  };
}

export async function submitPayment(data: {
  method: 'bKash' | 'Nagad';
  planId: string;
  senderPhone: string;
  trxId: string;
  deviceIp: string;
  deviceMac: string;
  deviceName: string;
}) {
  const remote = await safeFetchJson<{ success: boolean; request: HotspotRequest }>('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (remote && remote.success) return remote;

  // LocalStorage Fallback
  const plan = DEFAULT_PLANS.find(p => p.id === data.planId) || DEFAULT_PLANS[0];
  const newRequest: HotspotRequest = {
    id: `req-${Date.now()}`,
    method: data.method,
    planId: data.planId,
    amount: plan.price,
    senderPhone: data.senderPhone.trim(),
    trxId: data.trxId.trim().toUpperCase(),
    deviceIp: data.deviceIp || 'Local IP',
    deviceMac: data.deviceMac.toUpperCase(),
    deviceName: data.deviceName || detectDeviceName(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const requests = getStoredRequests();
  requests.unshift(newRequest);
  saveStoredRequests(requests);

  appendStoredLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Payment Submitted',
    details: `${newRequest.method} ৳${newRequest.amount} from ${newRequest.senderPhone} (TrxID: ${newRequest.trxId})`,
    type: 'info',
  });

  return { success: true, request: newRequest };
}

export async function pollRequestStatus(mac: string, requestId?: string) {
  const query = requestId 
    ? `?id=${encodeURIComponent(requestId)}&mac=${encodeURIComponent(mac)}`
    : `?mac=${encodeURIComponent(mac)}`;
  
  const remote = await safeFetchJson<{
    request: HotspotRequest | null;
    isApproved: boolean;
    isRejected: boolean;
    isBlocked: boolean;
    device: ConnectedDevice | null;
  }>(`/api/requests/status${query}`);

  if (remote) return remote;

  // LocalStorage Fallback
  const requests = getStoredRequests();
  const devices = getStoredDevices();

  let targetRequest: HotspotRequest | undefined;
  if (requestId) {
    targetRequest = requests.find(r => r.id === requestId);
  } else if (mac) {
    targetRequest = requests
      .filter(r => r.deviceMac.toLowerCase() === mac.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  const device = targetRequest 
    ? devices.find(d => d.mac.toLowerCase() === targetRequest!.deviceMac.toLowerCase())
    : (mac ? devices.find(d => d.mac.toLowerCase() === mac.toLowerCase()) : null);

  return {
    request: targetRequest || null,
    isApproved: targetRequest?.status === 'approved' || (device?.accessStatus === 'allowed' && device?.status === 'online'),
    isRejected: targetRequest?.status === 'rejected',
    isBlocked: device?.accessStatus === 'blocked',
    device: device || null,
  };
}

export async function adminLogin(password: string) {
  const remote = await safeFetchJson<{ success: boolean; token: string; user: { role: string; name: string } }>(
    '/api/admin/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }
  );

  if (remote && remote.success) return remote;

  // LocalStorage / Static Host Auth Check
  if (password === 'Vau@3200') {
    return {
      success: true,
      token: `local-token-${Date.now()}`,
      user: { role: 'admin', name: 'Hotspot Administrator' },
    };
  }

  throw new Error('Invalid administrator password.');
}

export async function getAdminStats(): Promise<AdminStats> {
  const remote = await safeFetchJson<AdminStats>('/api/admin/stats');
  if (remote) return remote;
  return computeLocalStats();
}

export async function getAdminDevices(): Promise<ConnectedDevice[]> {
  const remote = await safeFetchJson<ConnectedDevice[]>('/api/admin/devices');
  if (remote) return remote;
  return getStoredDevices();
}

export async function toggleDeviceAccess(id: string, mac?: string, allow?: boolean) {
  const remote = await safeFetchJson<{ success: boolean; device: ConnectedDevice; stats: AdminStats }>(
    '/api/admin/devices/toggle',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, mac, allow }),
    }
  );

  if (remote && remote.success) return remote;

  // LocalStorage Fallback
  const devices = getStoredDevices();
  const target = devices.find(d => d.id === id || (mac && d.mac.toLowerCase() === mac.toLowerCase()));

  if (!target) {
    throw new Error('Device not found');
  }

  const newStatus = allow === undefined 
    ? (target.accessStatus === 'allowed' ? 'blocked' : 'allowed') 
    : (allow ? 'allowed' : 'blocked');
  
  target.accessStatus = newStatus;
  target.lastActive = 'Just now';
  saveStoredDevices(devices);

  appendStoredLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: newStatus === 'allowed' ? 'Internet Access Restored' : 'Internet Access Blocked',
    details: `${target.name} (${target.mac}) marked as ${newStatus.toUpperCase()}`,
    type: newStatus === 'allowed' ? 'success' : 'warning',
  });

  return { success: true, device: target, stats: computeLocalStats() };
}

export async function addDevice(data: Partial<ConnectedDevice>) {
  const remote = await safeFetchJson<{ success: boolean; device: ConnectedDevice; stats: AdminStats }>(
    '/api/admin/devices/add',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (remote && remote.success) return remote;

  // LocalStorage Fallback
  const devices = getStoredDevices();
  const newDev: ConnectedDevice = {
    id: `dev-${Date.now()}`,
    mac: (data.mac || generateDeviceFingerprintToken()).toUpperCase(),
    ip: data.ip || '127.0.0.1',
    name: data.name || 'Authorized Device',
    connectionType: data.connectionType || '5 GHz',
    signalStrength: -50,
    status: 'online',
    accessStatus: data.accessStatus || 'allowed',
    downloadMb: 0,
    uploadMb: 0,
    connectedAt: new Date().toISOString(),
    lastActive: 'Just now',
  };

  devices.unshift(newDev);
  saveStoredDevices(devices);

  appendStoredLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Device Added Manually',
    details: `Added ${newDev.name} (${newDev.mac})`,
    type: 'info',
  });

  return { success: true, device: newDev, stats: computeLocalStats() };
}

export async function deleteDevice(id: string) {
  const remote = await safeFetchJson<{ success: boolean; stats: AdminStats }>(`/api/admin/devices/${id}`, {
    method: 'DELETE',
  });

  if (remote && remote.success) return remote;

  // LocalStorage Fallback
  let devices = getStoredDevices();
  const target = devices.find(d => d.id === id);
  devices = devices.filter(d => d.id !== id);
  saveStoredDevices(devices);

  if (target) {
    appendStoredLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Device Removed',
      details: `Removed device ${target.name} (${target.mac})`,
      type: 'danger',
    });
  }

  return { success: true, stats: computeLocalStats() };
}

export async function getAdminRequests(): Promise<HotspotRequest[]> {
  const remote = await safeFetchJson<HotspotRequest[]>('/api/admin/requests');
  if (remote) return remote;
  return getStoredRequests();
}

export async function approveRequest(id: string) {
  const remote = await safeFetchJson<{
    success: boolean;
    request: HotspotRequest;
    device: ConnectedDevice;
    stats: AdminStats;
  }>(`/api/admin/requests/${id}/approve`, {
    method: 'POST',
  });

  if (remote && remote.success) return remote;

  // LocalStorage Fallback
  const requests = getStoredRequests();
  const devices = getStoredDevices();
  const request = requests.find(r => r.id === id);

  if (!request) {
    throw new Error('Request not found');
  }

  request.status = 'approved';
  request.updatedAt = new Date().toISOString();

  const plan = DEFAULT_PLANS.find(p => p.id === request.planId) || DEFAULT_PLANS[0];
  const durationHours = plan.id === 'plan_50' ? 24 : 24 * 7;
  const expiresAt = new Date(Date.now() + durationHours * 3600000).toISOString();

  let dev = devices.find(d => d.mac.toLowerCase() === request.deviceMac.toLowerCase());
  if (dev) {
    dev.accessStatus = 'allowed';
    dev.status = 'online';
    dev.planName = `${plan.name} (৳${plan.price})`;
    dev.expiresAt = expiresAt;
    dev.lastActive = 'Just now';
  } else {
    dev = {
      id: `dev-${Date.now()}`,
      mac: request.deviceMac,
      ip: request.deviceIp,
      name: request.deviceName || detectDeviceName(),
      connectionType: '5 GHz',
      signalStrength: -48,
      status: 'online',
      accessStatus: 'allowed',
      downloadMb: 14.2,
      uploadMb: 3.8,
      connectedAt: new Date().toISOString(),
      expiresAt,
      planName: `${plan.name} (৳${plan.price})`,
      lastActive: 'Just now',
    };
    devices.unshift(dev);
  }

  saveStoredRequests(requests);
  saveStoredDevices(devices);

  appendStoredLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Payment Approved',
    details: `Approved ${request.method} ৳${request.amount} for ${request.deviceName} (${request.deviceMac}). Internet access granted!`,
    type: 'success',
  });

  return {
    success: true,
    request,
    device: dev,
    stats: computeLocalStats(),
  };
}

export async function rejectRequest(id: string, reason?: string) {
  const remote = await safeFetchJson<{ success: boolean; request: HotspotRequest; stats: AdminStats }>(
    `/api/admin/requests/${id}/reject`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }
  );

  if (remote && remote.success) return remote;

  // LocalStorage Fallback
  const requests = getStoredRequests();
  const request = requests.find(r => r.id === id);

  if (!request) {
    throw new Error('Request not found');
  }

  request.status = 'rejected';
  request.rejectReason = reason || 'Payment could not be verified in bKash/Nagad statement.';
  request.updatedAt = new Date().toISOString();

  saveStoredRequests(requests);

  appendStoredLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Payment Rejected',
    details: `Rejected TrxID ${request.trxId} (${request.senderPhone}): ${request.rejectReason}`,
    type: 'danger',
  });

  return { success: true, request, stats: computeLocalStats() };
}

export async function getAdminLogs(): Promise<AuditLog[]> {
  const remote = await safeFetchJson<AuditLog[]>('/api/admin/logs');
  if (remote) return remote;
  return getStoredLogs();
}

export async function resetDemoData() {
  const remote = await safeFetchJson<{ success: boolean; stats: AdminStats }>('/api/admin/reset', { method: 'POST' });
  if (remote && remote.success) return remote;

  // LocalStorage Fallback: reset to clean state
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(KEY_REQUESTS);
    localStorage.removeItem(KEY_DEVICES);
  }
  return { success: true, stats: computeLocalStats() };
}

export async function updateSettings(settings: Partial<PortalSettings>) {
  const remote = await safeFetchJson<{ success: boolean; settings: PortalSettings }>('/api/portal/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

  if (remote && remote.success) return remote;

  // LocalStorage Fallback
  const current = getStoredSettings();
  const updated = { ...current, ...settings };
  saveStoredSettings(updated);

  appendStoredLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Settings Updated',
    details: 'Admin updated portal payment configuration',
    type: 'info',
  });

  return { success: true, settings: updated };
}

export async function getPortalSettings(): Promise<PortalSettings> {
  const remote = await safeFetchJson<{ settings: PortalSettings }>('/api/portal/settings');
  if (remote && remote.settings) return remote.settings;
  return getStoredSettings();
}


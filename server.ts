import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type { 
  ConnectedDevice, 
  HotspotRequest, 
  PortalSettings, 
  AuditLog, 
  AdminStats,
  HotspotPlan 
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLANS: HotspotPlan[] = [
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

// In-Memory Database Store
let portalSettings: PortalSettings = {
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

let connectedDevices: ConnectedDevice[] = [];
let hotspotRequests: HotspotRequest[] = [];
let auditLogs: AuditLog[] = [
  {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'System Online',
    details: 'AmarWifi Hotspot Gateway initialized. bKash/Nagad: 01904031478 | WhatsApp: 01980000601',
    type: 'info',
  },
];

// Helper to calculate stats
function getAdminStats(): AdminStats {
  const onlineAllowed = connectedDevices.filter(d => d.status === 'online' && d.accessStatus === 'allowed').length;
  const totalAllowed = connectedDevices.filter(d => d.accessStatus === 'allowed').length;
  const totalBlocked = connectedDevices.filter(d => d.accessStatus === 'blocked').length;
  const pending = hotspotRequests.filter(r => r.status === 'pending').length;
  const approvedTotal = hotspotRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);
  
  return {
    totalOnline: onlineAllowed,
    allowed: totalAllowed,
    blocked: totalBlocked,
    pendingRequests: pending,
    totalRevenue: approvedTotal,
    totalDevices: connectedDevices.length,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // CORS Middleware for iframe sandbox compatibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-device-mac');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Session Detection (Simulates captive portal DHCP detection)
  app.get('/api/session', (req, res) => {
    const clientHeaderIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const requestedMac = (req.query.mac as string) || (req.headers['x-device-mac'] as string) || 'DEV-CLIENT';
    const requestedIp = (req.query.ip as string) || clientHeaderIp;
    
    // Find device in connected devices list
    const existingDevice = connectedDevices.find(
      d => d.mac.toLowerCase() === requestedMac.toLowerCase() || d.ip === requestedIp
    );

    // Find any existing request for this device
    const pendingOrLatestRequest = hotspotRequests
      .filter(r => r.deviceMac.toLowerCase() === requestedMac.toLowerCase())
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

    res.json({
      deviceIp: existingDevice ? existingDevice.ip : requestedIp,
      deviceMac: existingDevice ? existingDevice.mac : requestedMac,
      deviceName: existingDevice ? existingDevice.name : 'My Smartphone',
      userState,
      device: existingDevice || null,
      activeRequest: pendingOrLatestRequest || null,
      plans: PLANS,
      settings: portalSettings,
    });
  });

  // 2. Portal Settings
  app.get('/api/portal/settings', (req, res) => {
    res.json({
      settings: portalSettings,
      plans: PLANS,
    });
  });

  app.put('/api/portal/settings', (req, res) => {
    const updates = req.body;
    portalSettings = { ...portalSettings, ...updates };
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Settings Updated',
      details: 'Admin updated captive portal configuration',
      type: 'info',
    });
    res.json({ success: true, settings: portalSettings });
  });

  // 3. User Payment Submission
  app.post('/api/requests', (req, res) => {
    const { method, planId, senderPhone, trxId, deviceIp, deviceMac, deviceName } = req.body;

    if (!method || !planId || !senderPhone || !trxId || !deviceMac) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const plan = PLANS.find(p => p.id === planId) || PLANS[0];
    const newRequest: HotspotRequest = {
      id: `req-${Date.now()}`,
      method: method as 'bKash' | 'Nagad',
      planId,
      amount: plan.price,
      senderPhone: String(senderPhone).trim(),
      trxId: String(trxId).trim().toUpperCase(),
      deviceIp: deviceIp || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1',
      deviceMac: deviceMac.toUpperCase(),
      deviceName: deviceName || 'Mobile Client',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    hotspotRequests.unshift(newRequest);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Payment Submitted',
      details: `${newRequest.method} ৳${newRequest.amount} from ${newRequest.senderPhone} (TrxID: ${newRequest.trxId})`,
      type: 'info',
    });

    res.status(201).json({ success: true, request: newRequest });
  });

  // 4. Client Polls Request Status
  app.get('/api/requests/status', (req, res) => {
    const { id, mac } = req.query;

    let targetRequest: HotspotRequest | undefined;
    if (id) {
      targetRequest = hotspotRequests.find(r => r.id === id);
    } else if (mac) {
      targetRequest = hotspotRequests
        .filter(r => r.deviceMac.toLowerCase() === String(mac).toLowerCase())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }

    // Check device access status too
    let device = targetRequest 
      ? connectedDevices.find(d => d.mac.toLowerCase() === targetRequest!.deviceMac.toLowerCase())
      : (mac ? connectedDevices.find(d => d.mac.toLowerCase() === String(mac).toLowerCase()) : null);

    res.json({
      request: targetRequest || null,
      isApproved: targetRequest?.status === 'approved' || (device?.accessStatus === 'allowed' && device?.status === 'online'),
      isRejected: targetRequest?.status === 'rejected',
      isBlocked: device?.accessStatus === 'blocked',
      device: device || null,
    });
  });

  // 5. Admin Authentication
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'Vau@3200') {
      res.json({
        success: true,
        token: `token-${Date.now()}`,
        user: { role: 'admin', name: 'Hotspot Administrator' },
      });
    } else {
      res.status(401).json({ error: 'Invalid password. Please enter the correct admin password.' });
    }
  });

  // 6. Admin Stats
  app.get('/api/admin/stats', (req, res) => {
    res.json(getAdminStats());
  });

  // 7. Admin Connected Devices
  app.get('/api/admin/devices', (req, res) => {
    res.json(connectedDevices);
  });

  // Toggle Internet ON/OFF for a device
  app.post('/api/admin/devices/toggle', (req, res) => {
    const { id, mac, allow } = req.body;
    let target = connectedDevices.find(d => d.id === id || (mac && d.mac.toLowerCase() === mac.toLowerCase()));

    if (!target) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const newStatus = allow === undefined ? (target.accessStatus === 'allowed' ? 'blocked' : 'allowed') : (allow ? 'allowed' : 'blocked');
    target.accessStatus = newStatus;
    target.lastActive = 'Just now';

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: newStatus === 'allowed' ? 'Internet Access Restored' : 'Internet Access Blocked',
      details: `${target.name} (${target.mac}) marked as ${newStatus.toUpperCase()}`,
      type: newStatus === 'allowed' ? 'success' : 'warning',
    });

    res.json({ success: true, device: target, stats: getAdminStats() });
  });

  // Add Device Manually
  app.post('/api/admin/devices/add', (req, res) => {
    const { mac, ip, name, connectionType, accessStatus } = req.body;
    if (!mac || !ip) {
      return res.status(400).json({ error: 'MAC address and IP are required' });
    }

    const newDev: ConnectedDevice = {
      id: `dev-${Date.now()}`,
      mac: mac.toUpperCase(),
      ip,
      name: name || 'Authorized Device',
      connectionType: connectionType || '5 GHz',
      signalStrength: -52,
      status: 'online',
      accessStatus: accessStatus || 'allowed',
      downloadMb: 0,
      uploadMb: 0,
      connectedAt: new Date().toISOString(),
      lastActive: 'Just now',
    };

    connectedDevices.unshift(newDev);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Device Added Manually',
      details: `Added ${newDev.name} (${newDev.mac})`,
      type: 'info',
    });

    res.status(201).json({ success: true, device: newDev, stats: getAdminStats() });
  });

  // Delete Device
  app.delete('/api/admin/devices/:id', (req, res) => {
    const { id } = req.params;
    const target = connectedDevices.find(d => d.id === id);
    connectedDevices = connectedDevices.filter(d => d.id !== id);

    if (target) {
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Device Removed',
        details: `Removed device ${target.name} (${target.mac})`,
        type: 'danger',
      });
    }

    res.json({ success: true, stats: getAdminStats() });
  });

  // 8. Admin Requests List
  app.get('/api/admin/requests', (req, res) => {
    res.json(hotspotRequests);
  });

  // Approve Hotspot Request
  app.post('/api/admin/requests/:id/approve', (req, res) => {
    const { id } = req.params;
    const request = hotspotRequests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = 'approved';
    request.updatedAt = new Date().toISOString();

    const plan = PLANS.find(p => p.id === request.planId) || PLANS[0];
    const durationHours = plan.id === 'plan_50' ? 24 : 24 * 7;
    const expiresAt = new Date(Date.now() + durationHours * 3600000).toISOString();

    // Check if device already exists
    let dev = connectedDevices.find(d => d.mac.toLowerCase() === request.deviceMac.toLowerCase());
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
        name: request.deviceName || 'Hotspot Client',
        connectionType: '5 GHz',
        signalStrength: -49,
        status: 'online',
        accessStatus: 'allowed',
        downloadMb: 12.4,
        uploadMb: 3.1,
        connectedAt: new Date().toISOString(),
        expiresAt,
        planName: `${plan.name} (৳${plan.price})`,
        lastActive: 'Just now',
      };
      connectedDevices.unshift(dev);
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Payment Approved',
      details: `Approved ${request.method} ৳${request.amount} for ${request.deviceName} (${request.deviceMac}). Internet access granted!`,
      type: 'success',
    });

    res.json({ success: true, request, device: dev, stats: getAdminStats() });
  });

  // Reject Hotspot Request
  app.post('/api/admin/requests/:id/reject', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const request = hotspotRequests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = 'rejected';
    request.rejectReason = reason || 'Payment could not be verified in bKash/Nagad statement.';
    request.updatedAt = new Date().toISOString();

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Payment Rejected',
      details: `Rejected TrxID ${request.trxId} (${request.senderPhone}): ${request.rejectReason}`,
      type: 'danger',
    });

    res.json({ success: true, request, stats: getAdminStats() });
  });

  // 9. Admin Logs
  app.get('/api/admin/logs', (req, res) => {
    res.json(auditLogs);
  });

  // 10. Reset System Data
  app.post('/api/admin/reset', (req, res) => {
    hotspotRequests = [];
    connectedDevices = [];
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'System Reset',
      details: 'Hotspot controller data cleared by administrator',
      type: 'info',
    });

    res.json({ success: true, stats: getAdminStats() });
  });

  // Background bandwidth simulator to make traffic numbers feel alive
  setInterval(() => {
    connectedDevices.forEach(d => {
      if (d.status === 'online' && d.accessStatus === 'allowed') {
        const dlIncrement = +(Math.random() * 0.8 + 0.1).toFixed(1);
        const ulIncrement = +(Math.random() * 0.2 + 0.05).toFixed(1);
        d.downloadMb = +(d.downloadMb + dlIncrement).toFixed(1);
        d.uploadMb = +(d.uploadMb + ulIncrement).toFixed(1);
        d.lastActive = 'Just now';
      }
    });
  }, 4000);

  // ----------------------------------------------------
  // Vite Integration (Dev) / Static Serve (Prod)
  // ----------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AmarWifi] Captive Portal & Hotspot Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

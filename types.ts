export type PaymentMethod = 'bKash' | 'Nagad';

export interface HotspotPlan {
  id: 'plan_50' | 'plan_100';
  name: string;
  nameBn: string;
  price: number;
  duration: string;
  durationBn: string;
  dataLimit: string;
  speed: string;
  badge?: string;
  features: string[];
}

export interface HotspotRequest {
  id: string;
  method: PaymentMethod;
  planId: string;
  amount: number;
  senderPhone: string;
  trxId: string;
  deviceIp: string;
  deviceMac: string;
  deviceName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConnectedDevice {
  id: string;
  mac: string;
  ip: string;
  name: string;
  connectionType: '2.4 GHz' | '5 GHz' | 'Wi-Fi 6';
  signalStrength: number; // e.g. -54 dBm
  status: 'online' | 'offline';
  accessStatus: 'allowed' | 'blocked';
  downloadMb: number;
  uploadMb: number;
  connectedAt: string;
  expiresAt?: string;
  planName?: string;
  lastActive: string;
}

export interface PortalSettings {
  hotspotName: string;
  hotspotSubname: string;
  locationName: string;
  bkashNumber: string;
  nagadNumber: string;
  supportPhone: string;
  fee50: number;
  fee100: number;
  autoApproveDemo?: boolean;
}

export interface AdminStats {
  totalOnline: number;
  allowed: number;
  blocked: number;
  pendingRequests: number;
  totalRevenue: number;
  totalDevices: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

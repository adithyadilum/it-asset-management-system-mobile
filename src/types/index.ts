/**
 * TypeScript interfaces for the TIQRI Assets Mobile app.
 * Shaped for future API integration — swap mock data for real responses seamlessly.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'user' | 'manager';
  initials: string;
}

export interface Asset {
  id: string;
  name: string;
  tagId: string;
  status: 'new' | 'assigned' | 'lost' | 'disposed' | 'repair';
  assignedTo?: string;
  assignedDate?: string;
  category?: string;
}

export type ActivityEventType = 'assigned' | 'lost' | 'repair' | 'disposed' | 'new';

export interface ActivityEvent {
  id: string;
  description: string;
  assetName: string;
  assetTag: string;
  timestamp: string;
  type: ActivityEventType;
}

export interface KPIMetric {
  label: string;
  value: number;
  icon: string;
  accentColor: string;
  accentBg: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
}

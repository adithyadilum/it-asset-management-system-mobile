/**
 * Hardcoded mock data for the dashboard.
 * Shaped to match the types/index.ts interfaces so swapping to real API is trivial.
 */

import type { User, KPIMetric, ActivityEvent } from '../types';
import { Colors } from '../constants/colors';

export const mockUser: User = {
  id: 'usr-001',
  name: 'John Perera',
  email: 'john.perera@tiqri.com',
  role: 'user',
  initials: 'JP',
};

export const mockMetrics: KPIMetric[] = [
  {
    label: 'My Assigned Assets',
    value: 3,
    icon: 'clipboard',
    accentColor: Colors.info,
    accentBg: Colors.infoLight,
  },
  {
    label: 'Pending Approvals',
    value: 12,
    icon: 'alert',
    accentColor: Colors.warning,
    accentBg: Colors.warningLight,
  },
];

export const mockActivities: ActivityEvent[] = [
  {
    id: 'act-001',
    description: 'Laptop assigned to John Perera',
    assetName: 'MacBook Pro 14"',
    assetTag: 'AST-1023',
    timestamp: '2m ago',
    type: 'assigned',
  },
  {
    id: 'act-002',
    description: 'Server reported lost',
    assetName: 'Dell PowerEdge R740',
    assetTag: 'AST-0008',
    timestamp: '15m ago',
    type: 'lost',
  },
  {
    id: 'act-003',
    description: 'Projector sent for repair',
    assetName: 'Epson EB-2250U',
    assetTag: 'AST-0912',
    timestamp: '1h ago',
    type: 'repair',
  },
  {
    id: 'act-004',
    description: 'Monitor assigned to Sarah Chen',
    assetName: 'LG UltraWide 34"',
    assetTag: 'AST-0445',
    timestamp: '2h ago',
    type: 'assigned',
  },
  {
    id: 'act-005',
    description: 'Keyboard disposed',
    assetName: 'Logitech MX Keys',
    assetTag: 'AST-1101',
    timestamp: '3h ago',
    type: 'disposed',
  },
  {
    id: 'act-006',
    description: 'New tablet registered',
    assetName: 'iPad Pro 12.9"',
    assetTag: 'AST-1200',
    timestamp: '5h ago',
    type: 'new',
  },
];

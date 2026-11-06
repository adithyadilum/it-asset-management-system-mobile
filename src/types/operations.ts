export const taskKinds = [
  'handovers',
  'returns',
  'inspections',
  'maintenance',
  'renewals',
  'warranties',
  'disposals',
] as const;
export type TaskKind = (typeof taskKinds)[number];
export const taskLabels: Record<TaskKind, string> = {
  handovers: 'Handovers',
  returns: 'Returns due',
  inspections: 'Condition checks',
  maintenance: 'Maintenance',
  renewals: 'Software renewals',
  warranties: 'Warranty expiry',
  disposals: 'Disposals',
};
export interface OperationTask {
  id: string;
  kind: TaskKind;
  assetId: string;
  assetTag: string;
  name: string;
  model: string;
  imageUrl: string | null;
  pillar: string;
  assignmentId: number | null;
  custodian: string | null;
  dueDate: string | null;
  status: string;
  detail: string;
}
export interface TaskPage {
  data: OperationTask[];
  counts: Record<TaskKind, number>;
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}
export interface Recipient {
  id: string | number;
  name: string;
  detail: string;
}
export type ReturnCondition =
  'Good Working Condition' | 'Minor Issues' | 'Needs Repair' | 'Beyond Repair';
export type PhysicalCondition =
  'New' | 'Excellent' | 'Fair' | 'Poor' | 'Damaged';
export const returnOutcomes: Record<
  ReturnCondition,
  { status: string; description: string }
> = {
  'Good Working Condition': {
    status: 'Available',
    description: 'Ready to be assigned again.',
  },
  'Minor Issues': {
    status: 'In Repair',
    description: 'An internal maintenance ticket will be opened.',
  },
  'Needs Repair': {
    status: 'In Repair',
    description: 'An internal maintenance ticket will be opened.',
  },
  'Beyond Repair': {
    status: 'Pending Disposal',
    description:
      'A disposal request will be created for administrator approval.',
  },
};

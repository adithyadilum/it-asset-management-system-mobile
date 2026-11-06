import { fetchApi } from '../constants/api';
import type {
  TaskKind,
  TaskPage,
  Recipient,
  ReturnCondition,
  PhysicalCondition,
} from '../types/operations';
export interface TaskFilters {
  kind?: TaskKind;
  query?: string;
  pageSize?: number;
}
export async function fetchTasks(
  filters: TaskFilters = {},
  page = 1
): Promise<TaskPage> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(filters.pageSize ?? 20),
  });
  if (filters.kind) params.set('kind', filters.kind);
  if (filters.query) params.set('query', filters.query);
  return fetchApi<TaskPage>(`/api/v1/operations/tasks?${params}`);
}
export function searchRecipients(type: 'user' | 'location', query: string) {
  return fetchApi<{ data: Recipient[]; hasMore: boolean }>(
    `/api/v1/operations/recipients?${new URLSearchParams({ type, query })}`
  );
}
export interface OperationResult {
  success: boolean;
  message: string;
  assignmentId?: number;
}
export function createHandover(body: {
  assetId: string;
  expectedUpdatedAt: string;
  assignmentType: 'user' | 'location';
  targetId: string | number;
  expectedReturnDate?: string;
  notes?: string;
}) {
  return fetchApi<OperationResult>('/api/v1/operations/handovers', {
    method: 'POST',
    body,
  });
}
export function assignmentAction(
  assignmentId: number,
  body: {
    action: 'receive' | 'request-return' | 'remind';
    assetId: string;
    expectedUpdatedAt: string;
  }
) {
  return fetchApi<OperationResult>(
    `/api/v1/operations/assignments/${assignmentId}`,
    { method: 'POST', body }
  );
}
export function inspectReturn(body: {
  assetId: string;
  expectedUpdatedAt: string;
  condition: ReturnCondition;
  physicalCondition: PhysicalCondition;
  notes?: string;
}) {
  return fetchApi<OperationResult>('/api/v1/operations/inspections', {
    method: 'POST',
    body,
  });
}

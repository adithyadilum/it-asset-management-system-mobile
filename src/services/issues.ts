import { fetchApi } from '../constants/api';

export interface ReportIssueResult {
  success: boolean;
  message?: string;
  ticketId?: number;
}

/**
 * Reports a fault against an asset, which opens a maintenance ticket and moves
 * the asset to "In Repair" server-side.
 *
 * Throws on failure — callers should catch rather than inspect a flag.
 */
export async function reportAssetIssue(
  assetId: string,
  issueNote: string
): Promise<ReportIssueResult> {
  return fetchApi<ReportIssueResult>('/api/v1/issues', {
    method: 'POST',
    body: { assetId, issueNote },
  });
}

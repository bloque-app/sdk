import type { RequestCapableClient } from './errors';

/** Delivery state of an operation approval, from `/operation-approvals/result`. */
export type ApprovalResult =
  | { status: 'pending' }
  | { status: 'ready'; header: string; value: string }
  | { status: 'delivered' };

/** One read of the approval's delivery state. Not exported from the package. */
export function readApprovalResult(
  client: RequestCapableClient,
  approvalToken: string,
): Promise<ApprovalResult> {
  return client.request<ApprovalResult>({
    method: 'GET',
    path: '/api/origins/operation-approvals/result',
    authorizationOverride: `Bearer ${approvalToken}`,
    _skipExchange: true,
  });
}

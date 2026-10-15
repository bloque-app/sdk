import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import {
  ApprovalGate,
  type ApprovalOutcome,
  type GatedOperation,
} from '../approvals/approval-gate.ts';
import { logAndFormatToolError } from './bloque-error-mcp.ts';
import { mcpDebug } from './debug-log.ts';

/**
 * How long a tool waits for the owner's approval within one call. Kept under
 * the 60 s request timeout most MCP clients use.
 */
export const APPROVAL_WAIT_SECONDS = 45;
const MAX_APPROVAL_WAIT_SECONDS = 55;

/** The subset of the MCP request context the approval flow uses. */
export interface ToolCallContext {
  signal?: AbortSignal;
  _meta?: { progressToken?: string | number };
  sendNotification?: (notification: {
    method: 'notifications/progress';
    params: {
      progressToken: string | number;
      progress: number;
      message?: string;
    };
  }) => Promise<void>;
}

/** Shared by every MCP tool, so `check_approval` can resume any of them. */
export const approvalGate = new ApprovalGate();

/**
 * Runs a money-moving SDK call through the approval gate.
 *
 * When the client sent a `progressToken` it can show progress while a tool
 * runs, so the approval link goes out as a progress message and the tool
 * waits up to {@link APPROVAL_WAIT_SECONDS} for the owner. Otherwise it
 * returns `approval_required` at once, so the agent can share the link and
 * then call `check_approval` to wait.
 */
export async function runWithApproval<T>(
  context: ToolCallContext | undefined,
  operation: string,
  run: GatedOperation<T>,
  options: { repeatWith?: string; gate?: ApprovalGate } = {},
): Promise<ApprovalOutcome<T>> {
  const gate = options.gate ?? approvalGate;
  const progressToken = context?._meta?.progressToken;
  const canShowProgress =
    progressToken !== undefined && context?.sendNotification !== undefined;

  return await gate.run(operation, run, {
    waitMs: canShowProgress ? APPROVAL_WAIT_SECONDS * 1000 : 0,
    signal: context?.signal,
    repeatWith: options.repeatWith,
    onApprovalRequired: async (pending) => {
      // The link carries the approval token: never log it.
      mcpDebug('operation needs passkey approval', {
        approvalId: pending.approvalId,
        operation: pending.operation,
        expiresAt: pending.expiresAt,
      });
      if (!canShowProgress || progressToken === undefined) return;
      await context
        ?.sendNotification?.({
          method: 'notifications/progress',
          params: {
            progressToken,
            progress: 0,
            message: `Waiting for the account owner to open this link and approve "${pending.operation}" with their own passkey (only they can; do not open it yourself): ${pending.approvalUrl ?? '(no link)'}`,
          },
        })
        .catch(() => {});
    },
  });
}

/**
 * The approval link is for the account owner only. Said in every tool
 * description and every next step, so an agent never tries to approve.
 */
export const APPROVAL_LINK_RULE =
  'The approvalUrl is for the account owner to open and approve with their own passkey. Never open it, approve it or try to complete it on their behalf.';

/** Appended to the description of every tool that moves money. */
export const APPROVAL_TOOL_NOTE = `If the account owner must approve it with their passkey, returns status 'approval_required' with an approvalUrl to share with them and an approvalId for check_approval. ${APPROVAL_LINK_RULE}`;

const NOT_SURE_IT_MOVED =
  "Check the account's movements (list_account_movements) before repeating anything; never repeat a payment blindly.";

const repeat = (repeatWith: string | undefined) =>
  repeatWith ?? 'Repeat the original operation';

const NEXT_STEPS: {
  [S in Exclude<ApprovalOutcome<unknown>['status'], 'completed'>]: (
    outcome: Extract<ApprovalOutcome<unknown>, { status: S }>,
  ) => string;
} = {
  approval_required: () =>
    `Nothing has moved yet. Share approvalUrl with the account owner and ask them to open it and approve with their passkey before expiresAt. ${APPROVAL_LINK_RULE} Then call check_approval with approvalId: it waits up to ${APPROVAL_WAIT_SECONDS} seconds and completes the operation once approved. Do not repeat the original call, or a second approval is requested.`,
  in_progress: () =>
    'The owner approved and the operation is being sent now. Call check_approval again with the same approvalId to get its result. Do not repeat the original call.',
  approval_expired: (o) =>
    `Nothing has moved. ${repeat(o.repeatWith)} to request a new approval link.`,
  approval_rejected: (o) =>
    `Nothing has moved. ${repeat(o.repeatWith)} to request a new approval link, and ask the account owner to approve it with their own registered passkey.`,
  failed: () =>
    `The approved request was sent but did not return a result, so it may or may not have moved money. ${NOT_SURE_IT_MOVED}`,
  approval_not_found: () =>
    `This session has no record of that approval, so it cannot tell whether the operation ran. ${NOT_SURE_IT_MOVED}`,
};

/**
 * For workflows whose gated step is only part of the call (e.g. funding a
 * card the call already created): what to call instead of repeating the
 * whole workflow when the approval expires or is rejected.
 */
export function repeatStepWith(
  tool: string,
  args: Record<string, string>,
  alreadyDone: string,
): string {
  const list = Object.entries(args)
    .map(([key, value]) => `${key} "${value}"`)
    .join(', ');
  return `${alreadyDone}: do not repeat that call. Call ${tool} with ${list}`;
}

/** The outcome as JSON for the agent; non-completed ones carry `nextStep`. */
export function describeOutcome<T>(
  outcome: ApprovalOutcome<T>,
): { status: 'completed'; result: T } | Record<string, unknown> {
  if (outcome.status === 'completed') return outcome;
  const nextStep = (
    NEXT_STEPS[outcome.status] as (o: typeof outcome) => string
  )(outcome);
  return { ...outcome, nextStep };
}

/**
 * For workflows that embed a gated step: the step's result when it ran, or
 * its approval state when it did not.
 */
export function splitOutcome<T>(outcome: ApprovalOutcome<T> | undefined): {
  result?: T;
  approval?: Record<string, unknown>;
} {
  if (!outcome) return {};
  if (outcome.status === 'completed') return { result: outcome.result };
  return { approval: describeOutcome(outcome) };
}

type TextResult = {
  content: [{ type: 'text'; text: string }];
  isError?: boolean;
};

/**
 * Tool result for a call that is only the gated step: the step's result as
 * before when it completed, its approval state otherwise.
 */
export function approvalToolResult<T>(outcome: ApprovalOutcome<T>): TextResult {
  const body =
    outcome.status === 'completed' ? outcome.result : describeOutcome(outcome);
  return {
    content: [{ type: 'text', text: JSON.stringify(body, null, 2) }],
    ...(outcome.status === 'failed' && { isError: true }),
  };
}

export function registerApprovalTools(
  server: McpServer,
  gate: ApprovalGate = approvalGate,
) {
  server.registerTool(
    'check_approval',
    {
      description: `Check or resume a money-moving operation that is waiting for the account owner's passkey approval. Tools that move money (transfer, batch_transfer, fund_card, create_*_order, cashout_to_bank, send_to_breb_key, ...) return status 'approval_required' with an approvalUrl and approvalId when the owner must approve. ${APPROVAL_LINK_RULE} Share approvalUrl with the owner, then call this with the approvalId: it waits for the approval and runs the operation once, returning status 'completed' with the result, 'approval_required' if still waiting (call again), 'in_progress' while the approved operation is being sent (call again), 'approval_expired' / 'approval_rejected' (nothing moved; follow nextStep), or 'failed' (follow nextStep). Calling it again after it completed returns the same result; it never sends the operation twice. Call without approvalId to list pending approvals.`,
      inputSchema: {
        approvalId: z.string().optional(),
        waitSeconds: z
          .number()
          .int()
          .min(0)
          .max(MAX_APPROVAL_WAIT_SECONDS)
          .optional()
          .describe(
            `How long to wait for the approval in this call (default ${APPROVAL_WAIT_SECONDS}, 0 to only check).`,
          ),
      },
    },
    async ({ approvalId, waitSeconds }, extra) => {
      if (!approvalId) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ pending: gate.list() }, null, 2),
            },
          ],
        };
      }
      try {
        const outcome = await gate.resume(approvalId, {
          waitMs: (waitSeconds ?? APPROVAL_WAIT_SECONDS) * 1000,
          signal: extra?.signal,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(describeOutcome(outcome), null, 2),
            },
          ],
        };
      } catch (err) {
        return logAndFormatToolError('check_approval', err);
      }
    },
  );
}

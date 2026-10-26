// Transfer With a Passkey Approval Over a Full-Page Redirect
//
// When the account owner must approve a transfer with their passkey, the
// first call throws `BloqueApprovalRequiredError`. In a browser you send the
// owner to `error.approvalUrl` and they come back to `approvalReturnUrl`; your
// page is gone by then, so save the pending approval before leaving and
// finish the transfer when they return.
//
// This script plays both halves:
//   bun 6-transfer-approval-redirect.ts start  <sourceUrn> <destinationUrn>
//   (open the printed link and approve with the owner's passkey)
//   bun 6-transfer-approval-redirect.ts resume
//
// In a browser, keep the saved state in `sessionStorage` instead of a file.
// It holds the approval token: never put it in a URL or a log.

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import {
  BloqueApprovalPendingError,
  BloqueApprovalRequiredError,
  SDK,
} from '../../../packages/sdk/src/index';

const STATE_FILE = '.pending-transfer.json';
const RETURN_URL = process.env.RETURN_URL ?? 'https://myapp.com/transfers/back';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect(process.env.ALIAS ?? '@nestor');
const [step, sourceUrn, destinationUrn] = process.argv.slice(2);

if (step === 'start') {
  const params = {
    sourceUrn: sourceUrn!,
    destinationUrn: destinationUrn!,
    amount: '1000000', // 1 DUSD
    asset: 'DUSD/6' as const,
    metadata: { note: 'Approved over a redirect' },
  };
  const idempotencyKey = crypto.randomUUID();

  try {
    const result = await user.accounts.transfer(params, {
      idempotencyKey,
      approvalReturnUrl: RETURN_URL,
    });
    console.log('No approval needed. Transfer queued:', result.queueId);
  } catch (error) {
    if (!(error instanceof BloqueApprovalRequiredError)) throw error;

    // Save everything needed to repeat the same call, then leave.
    writeFileSync(
      STATE_FILE,
      JSON.stringify({
        params,
        idempotencyKey,
        pending: error.toPendingApproval(),
      }),
    );
    console.log('Approve:', error.summary);
    console.log('Open this link as the account owner:', error.approvalUrl);
    console.log(`Back on ${RETURN_URL}, run: bun ${process.argv[1]} resume`);
  }
} else if (step === 'resume') {
  if (!existsSync(STATE_FILE)) throw new Error('Nothing pending: run start');
  const saved = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));

  try {
    // Collects the approval once. Repeat the call right away: it is dropped
    // about two minutes after the owner opened the approval page.
    const approval = await user.approvals.collect(saved.pending);
    rmSync(STATE_FILE);

    const result = await user.accounts.transfer(saved.params, {
      idempotencyKey: saved.idempotencyKey,
      approval,
    });
    console.log('Transfer queued:', result.queueId, result.status);
  } catch (error) {
    if (error instanceof BloqueApprovalPendingError) {
      console.log('Not approved yet. Open again:', saved.pending.approvalUrl);
    } else {
      // Expired or already used: run start again for a new approval.
      rmSync(STATE_FILE, { force: true });
      throw error;
    }
  }
} else {
  console.log('Usage: start <sourceUrn> <destinationUrn> | resume');
}

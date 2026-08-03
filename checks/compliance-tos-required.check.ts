/**
 * Check A — RTP requires TOS acceptance first.
 *
 * Verifies, against the real sandbox backend (no mocking), that:
 *   1. A brand-new identity is blocked from an RTP payout by
 *      `BloqueVerificationRequiredError` with `reason === 'tos'`.
 *   2. `error.getVerificationLink()` resolves to a TOS-gate URL, which can
 *      be driven end-to-end (`compliance.tosGate.init` -> `.accept`).
 *   3. Retrying the same action afterward is no longer blocked by TOS
 *      (it may still be blocked by something else, e.g. KYC — this check
 *      only asserts the TOS gap specifically was resolved).
 *
 * Run: `bun run checks/compliance-tos-required.check.ts`
 * Requires: see checks/README.md (ORIGIN, ORIGIN_KEY, CHECK_RETURN_URL).
 */
/**
 * Imported from the aggregated `sdk` package's entry point, not directly
 * from `packages/core/src/index` — the latter is a *different* module
 * instance than the one `@bloque/sdk-swap` (used below via `clients.swap`)
 * actually throws, since `swap` resolves `@bloque/sdk-core` to its built
 * `dist/` output while `../packages/core/src/index` is the raw source.
 * Bun/Node treat those as two distinct classes, so `instanceof` against
 * the source-imported class silently fails even though the error's own
 * `name`/message look identical. `packages/sdk/src/index` re-exports the
 * same dist-resolved class every other SDK consumer gets.
 */
import { BloqueVerificationRequiredError } from '../packages/sdk/src/index';
import { completeTos } from './lib/complete-tos';
import { requireEnv } from './lib/env';
import { registerFreshIdentity } from './lib/register-identity';
import { assert, info, ok, step } from './lib/report';

const RETURN_URL =
  process.env.CHECK_RETURN_URL ?? 'https://example.com/verification-complete';
const AMOUNT_SRC = process.env.CHECK_AMOUNT_SRC ?? '100000000'; // 100.000000 DUSD

async function attemptRtp(
  clients: Awaited<ReturnType<typeof registerFreshIdentity>>['clients'],
) {
  const rates = await clients.swap.findRates({
    fromAsset: 'DUSD/6',
    toAsset: 'USD/2',
    fromMediums: ['kusama'],
    toMediums: ['rtp'],
    amountSrc: AMOUNT_SRC,
  });
  assert(
    rates.rates.length > 0,
    'No kusama->rtp rates available in sandbox — cannot exercise swap.rtp.create() at all. ' +
      'This is an environment prerequisite, not a compliance bug.',
  );

  return clients.swap.rtp.create(
    {
      rateSig: rates.rates[0]!.sig,
      amountSrc: AMOUNT_SRC,
      depositInformation: {
        owner: 'SDK Check',
        accountNumber: '1234567890',
        routingNumber: '063108680',
        accountType: 'checking',
      },
      args: { sourceAccountUrn: 'did:bloque:account:sdk-check-source' },
    },
    { idempotencyKey: `sdk-check-tos-${Date.now()}` },
  );
}

async function main() {
  requireEnv('ORIGIN');
  requireEnv('ORIGIN_KEY');

  step('Registering a fresh identity (no TOS, no KYC)');
  const { clients, alias, urn } = await registerFreshIdentity({
    aliasPrefix: 'sdk-check-tos',
  });
  ok(`Registered ${alias} (${urn})`);

  step('Reading tier status before any action');
  const statusBefore = await clients.compliance.tiers.getStatus({ urn });
  info(
    `effectiveLevel=${statusBefore.effectiveLevel} missingRequirements=${JSON.stringify(statusBefore.missingRequirements)}`,
  );
  assert(
    statusBefore.effectiveLevel < 0,
    `expected a fresh identity to start below Level 0, got effectiveLevel=${statusBefore.effectiveLevel}`,
  );

  step('Attempting swap.rtp.create() — expecting it to be blocked');
  let blockedError: unknown;
  try {
    const result = await attemptRtp(clients);
    throw new Error(
      `swap.rtp.create() unexpectedly succeeded (order ${result.order.id}) — a fresh, unverified identity should never be allowed to move money.`,
    );
  } catch (error) {
    blockedError = error;
  }

  assert(
    blockedError instanceof BloqueVerificationRequiredError,
    `expected a BloqueVerificationRequiredError, got: ${
      blockedError instanceof Error
        ? `${blockedError.name}: ${blockedError.message}`
        : String(blockedError)
    }`,
  );
  const verificationError = blockedError as BloqueVerificationRequiredError;
  ok(
    `Blocked with E_VERIFICATION_REQUIRED (reason: ${verificationError.reason})`,
  );
  info(
    `missingRequirements=${JSON.stringify(verificationError.missingRequirements)}`,
  );
  assert(
    verificationError.reason === 'tos',
    `expected reason 'tos' for a brand-new identity, got '${verificationError.reason}' — ` +
      'if this is "kyc", TOS may already be considered satisfied for this profile; if it is ' +
      '"unknown", the compliance response shape may have changed.',
  );

  await completeTos(clients, verificationError, RETURN_URL);

  step('Retrying swap.rtp.create() — TOS should no longer be the blocker');
  try {
    const result = await attemptRtp(clients);
    ok(
      `swap.rtp.create() succeeded after TOS acceptance (order ${result.order.id}) — ` +
        'this identity apparently needs no further verification for this action/amount.',
    );
  } catch (error) {
    if (error instanceof BloqueVerificationRequiredError) {
      assert(
        error.reason !== 'tos',
        `TOS was accepted, but the retry is still blocked with reason 'tos' — ` +
          `acceptance did not take effect. missingRequirements=${JSON.stringify(error.missingRequirements)}`,
      );
      ok(
        `Retry still blocked, but no longer on TOS (reason: ${error.reason}, missing: ${JSON.stringify(error.missingRequirements)}) — expected for an identity with no KYC on file.`,
      );
    } else {
      throw error;
    }
  }

  console.log(
    '\n✅ Check A passed: RTP is gated on TOS acceptance as expected.\n',
  );
}

main().catch((error) => {
  console.error(
    '\n❌ Check A failed:',
    error instanceof Error ? error.message : error,
  );
  if (error instanceof Error && error.stack) {
    console.error(error.stack.split('\n').slice(1).join('\n'));
  }
  process.exit(1);
});

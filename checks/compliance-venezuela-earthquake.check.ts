/**
 * Check B — Venezuelan residents must also submit the earthquake
 * questionnaire before reaching Level 1.
 *
 * Verifies, against the real sandbox backend (no mocking), that:
 *   1. A fresh Venezuela-resident identity is blocked by TOS first (same
 *      as any other identity — reuses Check A's TOS-completion flow).
 *   2. After TOS, it's blocked again with `reason === 'documents'` and
 *      `earthquake_impact_declaration` in `missingRequirements` — the
 *      Venezuela-specific manual_review requirement, alongside `kyc_basic`.
 *   3. `getVerificationLink()` resolves to a verification-gate URL that,
 *      once driven (`init` -> `submit`), lists exactly that requirement
 *      (KYC never appears here — it has no hosted-gate handoff) with its
 *      configured form fields, and accepts an answer for it.
 *   4. Retrying `swap.rtp.create()` immediately after `submit()` is STILL
 *      blocked — a customer's own submission never self-satisfies a
 *      requirement, only an ops reviewer recording `status: "satisfied"`
 *      clears it — but the block now says so honestly: the declaration
 *      moves to `pendingRequirements` and stops being something the
 *      customer is sent back to submit again. Concretely, `reason` is no
 *      longer `'documents'` and `getVerificationLink()` returns `null`,
 *      because the only actionable requirement left is KYC. If the
 *      declaration were the *only* thing outstanding, the block would be
 *      a `BloqueVerificationPendingError` instead. See checks/README.md.
 *   5. Re-running `init()` on the same gate token lists the declaration
 *      under `pendingRequirements`, never under `requirements` — the gate
 *      does not re-collect what a reviewer already holds.
 *
 * Run: `bun run checks/compliance-venezuela-earthquake.check.ts`
 * Requires: see checks/README.md (ORIGIN, ORIGIN_KEY, CHECK_RETURN_URL).
 */
/**
 * See the equivalent import comment in `compliance-tos-required.check.ts`:
 * these must come from the aggregated `sdk` package's entry point, not
 * `packages/core/src/index` directly, or `instanceof` against the errors
 * `clients.swap` actually throws (resolved through `@bloque/sdk-core`'s
 * built `dist/`) silently fails.
 */
import {
  BloqueVerificationPendingError,
  BloqueVerificationRequiredError,
} from '../packages/sdk/src/index';
import { completeTos } from './lib/complete-tos';
import { requireEnv } from './lib/env';
import { extractGateToken } from './lib/gate-token';
import { registerFreshIdentity } from './lib/register-identity';
import { assert, info, ok, step } from './lib/report';

const RETURN_URL =
  process.env.CHECK_RETURN_URL ?? 'https://example.com/verification-complete';
const AMOUNT_SRC = process.env.CHECK_AMOUNT_SRC ?? '100000000'; // 100.000000 DUSD
const EARTHQUAKE_REQUIREMENT_KEY = 'earthquake_impact_declaration';

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
    { idempotencyKey: `sdk-check-ven-${Date.now()}` },
  );
}

async function expectBlocked(
  clients: Awaited<ReturnType<typeof registerFreshIdentity>>['clients'],
): Promise<BloqueVerificationRequiredError> {
  try {
    const result = await attemptRtp(clients);
    throw new Error(
      `swap.rtp.create() unexpectedly succeeded (order ${result.order.id}).`,
    );
  } catch (error) {
    assert(
      error instanceof BloqueVerificationRequiredError,
      `expected a BloqueVerificationRequiredError, got: ${
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error)
      }`,
    );
    return error as BloqueVerificationRequiredError;
  }
}

/**
 * Post-submit the block can legitimately take either shape, and which one
 * depends on the sandbox policy rather than on the behavior under test:
 * `E_VERIFICATION_PENDING` when the declaration is all that is left, or
 * `E_VERIFICATION_REQUIRED` when KYC is still outstanding alongside it.
 * Both must report the declaration as pending, which is the actual claim.
 */
async function expectBlockedAfterSubmit(
  clients: Awaited<ReturnType<typeof registerFreshIdentity>>['clients'],
): Promise<BloqueVerificationRequiredError | BloqueVerificationPendingError> {
  try {
    const result = await attemptRtp(clients);
    throw new Error(
      `swap.rtp.create() unexpectedly succeeded (order ${result.order.id}) — ` +
        'a customer submission must never satisfy a requirement on its own.',
    );
  } catch (error) {
    assert(
      error instanceof BloqueVerificationRequiredError ||
        error instanceof BloqueVerificationPendingError,
      `expected a verification-required or verification-pending error, got: ${
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error)
      }`,
    );
    return error;
  }
}

async function main() {
  requireEnv('ORIGIN');
  requireEnv('ORIGIN_KEY');

  step('Registering a fresh Venezuela-resident identity');
  const { clients, alias, urn } = await registerFreshIdentity({
    aliasPrefix: 'sdk-check-ven',
    countryOfResidenceCode: 'VEN',
    countryOfBirthCode: 'VEN',
  });
  ok(`Registered ${alias} (${urn})`);

  step('Attempting swap.rtp.create() — expecting TOS to block first');
  const tosError = await expectBlocked(clients);
  ok(`Blocked with reason: ${tosError.reason}`);
  assert(
    tosError.reason === 'tos',
    `expected reason 'tos' before any acceptance, got '${tosError.reason}'`,
  );
  await completeTos(clients, tosError, RETURN_URL);

  step(
    'Retrying swap.rtp.create() — expecting the earthquake declaration (and KYC) to block next',
  );
  const documentsError = await expectBlocked(clients);
  ok(`Blocked with reason: ${documentsError.reason}`);
  info(
    `missingRequirements=${JSON.stringify(documentsError.missingRequirements)}`,
  );
  assert(
    documentsError.reason === 'documents',
    `expected reason 'documents' after TOS acceptance for a VEN identity, got '${documentsError.reason}'`,
  );
  assert(
    documentsError.missingRequirements.includes(EARTHQUAKE_REQUIREMENT_KEY),
    `expected '${EARTHQUAKE_REQUIREMENT_KEY}' in missingRequirements, got ${JSON.stringify(documentsError.missingRequirements)}`,
  );

  step('Resolving the documents gap via error.getVerificationLink()');
  const link = await documentsError.getVerificationLink({
    returnUrl: RETURN_URL,
  });
  assert(
    link,
    'getVerificationLink() returned null for a reason: "documents" error',
  );
  ok(`Got hosted verification gate URL (expires in ${link.expiresIn})`);
  const token = extractGateToken(link.url);

  step('Driving the verification gate programmatically: GET /init');
  const init = await clients.compliance.verificationGate.init({ token });
  info(`requirements: ${init.requirements.map((r) => r.key).join(', ')}`);

  const earthquakeRequirement = init.requirements.find(
    (r) => r.key === EARTHQUAKE_REQUIREMENT_KEY,
  );
  assert(
    earthquakeRequirement,
    `expected '${EARTHQUAKE_REQUIREMENT_KEY}' in the verification gate's requirements, got: ${init.requirements
      .map((r) => r.key)
      .join(', ')}`,
  );
  assert(
    !init.requirements.some((r) => r.kind === 'kyc'),
    'kyc_basic should never appear in the verification gate — it has no hosted-page handoff',
  );
  ok(
    `Found '${EARTHQUAKE_REQUIREMENT_KEY}' (kind: ${earthquakeRequirement.kind})`,
  );
  info(
    `fields: ${(earthquakeRequirement.fields ?? []).map((f) => `${f.key}:${f.type}`).join(', ')}`,
  );

  const affectedField = earthquakeRequirement.fields?.find(
    (f) => f.key === 'affected',
  );
  assert(
    affectedField,
    "expected the earthquake requirement to define an 'affected' boolean field",
  );

  step(
    'Asserting title/requiresUpload/description/localized-options field descriptors',
  );
  assert(
    !!earthquakeRequirement.title &&
      earthquakeRequirement.title !== EARTHQUAKE_REQUIREMENT_KEY,
    `expected a human-readable 'title' distinct from the raw key, got: ${JSON.stringify(earthquakeRequirement.title)}`,
  );
  ok(`title: "${earthquakeRequirement.title}"`);
  assert(
    earthquakeRequirement.uploadable === false,
    `expected uploadable === false — this manual_review is form-only (policy sets requires_upload: false), got ${earthquakeRequirement.uploadable}`,
  );
  assert(
    earthquakeRequirement.uploadIntents === undefined,
    'expected no uploadIntents for a non-uploadable requirement',
  );
  ok(
    'uploadable correctly reports this requirement as form-only (no upload control).',
  );
  assert(
    !!affectedField.description,
    "expected the 'affected' field to carry help text (description)",
  );
  ok(`affected.description: "${affectedField.description}"`);

  const impactTypeField = earthquakeRequirement.fields?.find(
    (f) => f.key === 'impact_type',
  );
  assert(
    impactTypeField,
    "expected the earthquake requirement to define an 'impact_type' select field",
  );
  assert(
    impactTypeField.locale === 'es',
    `expected impact_type.locale === 'es' (Venezuela-only, fixed-Spanish card), got ${JSON.stringify(impactTypeField.locale)}`,
  );
  const options = impactTypeField.options ?? [];
  assert(
    options.length > 0,
    'expected impact_type to define at least one select option',
  );
  assert(
    options.every(
      (option) =>
        typeof option === 'object' &&
        option !== null &&
        typeof option.value === 'string' &&
        typeof option.label?.en === 'string' &&
        typeof option.label?.es === 'string',
    ),
    `expected every impact_type option to be a localized { value, label: { en, es } } object, got: ${JSON.stringify(options)}`,
  );
  ok(
    `impact_type has ${options.length} localized options, pinned to locale "${impactTypeField.locale}" (e.g. ${JSON.stringify(options[0])})`,
  );

  step('Driving the verification gate programmatically: POST /submit');
  const submitResult = await clients.compliance.verificationGate.submit({
    token,
    csrfToken: init.csrfToken,
    answers: [
      {
        requirementKey: EARTHQUAKE_REQUIREMENT_KEY,
        values: { affected: false },
      },
    ],
  });
  assert(
    submitResult.answers.length === 1,
    `expected 1 recorded answer, got ${submitResult.answers.length}`,
  );
  ok('Submission recorded.');

  step(
    'Retrying swap.rtp.create() right after submit() — expecting it to STILL be blocked, but as "under review" rather than "submit it again"',
  );
  const postSubmitError = await expectBlockedAfterSubmit(clients);
  ok(`Still blocked: ${postSubmitError.name}`);
  info(
    `pendingRequirements=${JSON.stringify(postSubmitError.pendingRequirements)}`,
  );
  assert(
    postSubmitError.pendingRequirements.includes(EARTHQUAKE_REQUIREMENT_KEY),
    `expected '${EARTHQUAKE_REQUIREMENT_KEY}' in pendingRequirements post-submit, got ${JSON.stringify(postSubmitError.pendingRequirements)}`,
  );

  if (postSubmitError instanceof BloqueVerificationPendingError) {
    ok(
      'Everything outstanding is under review — no hosted gate is offered at all.',
    );
  } else {
    info(
      `missingRequirements=${JSON.stringify(postSubmitError.missingRequirements)}`,
    );
    assert(
      postSubmitError.missingRequirements.includes(EARTHQUAKE_REQUIREMENT_KEY),
      `expected '${EARTHQUAKE_REQUIREMENT_KEY}' to still block (ops approval, not submission, clears it), got ${JSON.stringify(postSubmitError.missingRequirements)}`,
    );
    assert(
      postSubmitError.reason !== 'documents',
      'expected the block to stop pointing at the documents gate once the declaration is under review — a customer sent back there would be asked to resubmit what ops already holds',
    );
    const postSubmitLink = await postSubmitError.getVerificationLink({
      returnUrl: RETURN_URL,
    });
    assert(
      postSubmitLink === null,
      `expected no verification link post-submit, got ${postSubmitLink?.url}`,
    );
    ok(
      `Only KYC remains actionable (reason: ${postSubmitError.reason}), and no gate link is offered.`,
    );
  }

  step('Re-running init() — the gate must not ask for the declaration again');
  const reInit = await clients.compliance.verificationGate.init({ token });
  info(
    `requirements=${JSON.stringify(reInit.requirements.map((r) => r.key))} pendingRequirements=${JSON.stringify(reInit.pendingRequirements.map((r) => r.key))}`,
  );
  assert(
    !reInit.requirements.some((r) => r.key === EARTHQUAKE_REQUIREMENT_KEY),
    `'${EARTHQUAKE_REQUIREMENT_KEY}' must not be offered for collection again after submission`,
  );
  assert(
    reInit.pendingRequirements.some(
      (r) => r.key === EARTHQUAKE_REQUIREMENT_KEY,
    ),
    `expected '${EARTHQUAKE_REQUIREMENT_KEY}' in the gate's pendingRequirements, got ${JSON.stringify(reInit.pendingRequirements.map((r) => r.key))}`,
  );
  ok('The gate reports it as under review instead of re-collecting it.');

  console.log(
    '\n✅ Check B passed: Venezuela residents are gated on the earthquake declaration (in addition to KYC) after TOS, and once submitted it is reported as under review rather than requested again — the block only clears when ops approves.\n',
  );
}

main().catch((error) => {
  console.error(
    '\n❌ Check B failed:',
    error instanceof Error ? error.message : error,
  );
  if (error instanceof Error && error.stack) {
    console.error(error.stack.split('\n').slice(1).join('\n'));
  }
  process.exit(1);
});

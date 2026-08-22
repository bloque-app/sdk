/**
 * Origin-operator self-serve path against a deployed sandbox.
 *
 * Registers a fresh identity, drives compliance decide() gaps (TOS /
 * documents / KYC), creates an org, completes org KYB, creates an origin,
 * then assume / mint / exchange — all through the SDK.
 *
 * Requires sandbox `DEV_AUTO_APPROVE_KYC=true`.
 *
 * Run: `bun run checks/origin-operator-read-only.check.ts`
 */
import {
  BloqueAPIError,
  BloqueVerificationRequiredError,
  type BloqueClients,
} from '../packages/sdk/src/index';
import { completeTos } from './lib/complete-tos';
import { requireEnv } from './lib/env';
import { extractGateToken } from './lib/gate-token';
import { registerFreshIdentity } from './lib/register-identity';
import { assert, info, ok, step } from './lib/report';

const RETURN_URL =
  process.env.CHECK_RETURN_URL ?? 'https://example.com/verification-complete';

const ORG_CREATE_BODY = {
  org_type: 'business' as const,
  profile: {
    legal_name: 'SDK Origin Org',
    tax_id: '123456789',
    incorporation_date: '2023-01-01',
    business_type: 'LLC',
    incorporation_country_code: 'US',
    incorporation_state: 'CA',
    address_line1: '1 Test Way',
    postal_code: '90210',
    city: 'Los Angeles',
    logo_url: 'https://example.com/logo.png',
    places: [],
  },
  metadata: {},
};

async function driveVerificationGaps(
  clients: BloqueClients,
  urn: string,
): Promise<{ urn: string; status?: string }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await clients.orgs.create(ORG_CREATE_BODY);
    } catch (error) {
      assert(
        error instanceof BloqueVerificationRequiredError,
        `expected BloqueVerificationRequiredError, got ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const verificationError = error as BloqueVerificationRequiredError;
      info(
        `orgs.create blocked reason=${verificationError.reason} missing=${JSON.stringify(verificationError.missingRequirements)}`,
      );
      if (verificationError.reason === 'tos') {
        await completeTos(clients, verificationError, RETURN_URL);
        continue;
      }
      if (verificationError.reason === 'documents') {
        const link = await verificationError.getVerificationLink({
          returnUrl: RETURN_URL,
        });
        assert(link, 'documents gap had no verification link');
        const token = extractGateToken(link.url);
        const init = await clients.compliance.verificationGate.init({ token });
        await clients.compliance.verificationGate.submit({
          token,
          csrfToken: init.csrfToken,
          answers: init.requirements.map((r) => ({
            requirementKey: r.key,
            values: Object.fromEntries(
              (r.fields ?? [])
                .filter((f) => f.required)
                .map((f) => [f.key, f.type === 'boolean' ? false : 'n/a']),
            ),
          })),
        });
        ok('submitted documents gate');
        continue;
      }
      if (verificationError.reason === 'kyc') {
        const kyc = await clients.compliance.kyc.startVerification({ urn });
        assert(
          kyc.status === 'approved' || kyc.status === 'APPROVED',
          `expected sandbox KYC auto-APPROVE, got ${kyc.status}`,
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error('orgs.create still gated after driving TOS/docs/KYC');
}

async function pollOrgActive(
  clients: BloqueClients,
  orgUrn: string,
): Promise<void> {
  step('Waiting for org status=active after KYB');
  for (let i = 0; i < 20; i++) {
    const org = await clients.orgs.get(orgUrn);
    info(`org status=${org.status} (attempt ${i + 1})`);
    if (org.status === 'active') {
      ok('org is active');
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`org ${orgUrn} did not become active`);
}

async function main() {
  requireEnv('ORIGIN');
  requireEnv('ORIGIN_KEY');

  step('Registering a fresh identity');
  const { clients, alias, urn } = await registerFreshIdentity({
    aliasPrefix: 'sdk-oo',
  });
  ok(`Registered ${alias} (${urn})`);

  step('Creating an org (drive compliance gates as needed)');
  let org: { urn: string; status?: string };
  try {
    org = await clients.orgs.create(ORG_CREATE_BODY);
  } catch (error) {
    if (!(error instanceof BloqueVerificationRequiredError)) throw error;
    org = await driveVerificationGaps(clients, urn);
  }
  assert(org.urn, 'orgs.create did not return an org URN');
  ok(`Created org ${org.urn}`);

  step('Starting org KYB');
  const kyb = await clients.compliance.kyc.startVerification({
    urn: org.urn,
    type: 'kyb',
  });
  ok(`org KYB start returned status=${kyb.status}`);
  await pollOrgActive(clients, org.urn);

  const namespace = `e2eoo${Date.now().toString(36)}`;
  step(`Creating origin ${namespace}`);
  const created = await clients.orgs.createOrigin(org.urn, { namespace });
  assert(
    created.originApiKey?.startsWith('sk_'),
    'expected originApiKey once',
  );
  ok(`origin created; key prefix ${created.originApiKey.slice(0, 10)}…`);

  step(`Assume origin ${namespace}`);
  const assumed = await clients.orgs.assumeOrigin(namespace);
  assert(assumed.accessToken, 'assumeOrigin did not return an access token');
  ok('assumed origin-operator JWT');

  step('Mint a lookup-only bound key');
  const minted = await clients.identity.apiKeys.create({
    name: `e2e-origin-operator-${Date.now()}`,
    scopes: ['identity.read.origin', 'alias.find.origin'],
    domains: [],
    expiration: 'never',
  });
  assert(minted.secretKey, 'mint did not return a secret key');
  ok('minted bound sk_');

  step('Operator JWT must not mint pay/write scopes');
  try {
    await clients.identity.apiKeys.create({
      name: 'e2e-should-fail',
      scopes: ['payments.pay'],
      domains: [],
      expiration: 'never',
    });
    throw new Error('catalog should reject pay/write');
  } catch (err) {
    if (!(err instanceof BloqueAPIError)) throw err;
    assert(err.status === 403, `expected 403, got ${err.status}`);
  }
  ok('catalog rejects pay/write');

  step('Exchange without asIdentity');
  const exchanged = await clients.identity.apiKeys.exchange({
    key: minted.secretKey,
  });
  assert(exchanged.accessToken, 'exchange failed');
  ok('bound key exchanges for an origin-operator JWT');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

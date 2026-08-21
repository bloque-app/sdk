/**
 * Origin-operator read-only keys against a deployed sandbox.
 *
 * Skips (exit 0) unless ORIGIN_OPERATOR_USER_TOKEN and
 * ORIGIN_OPERATOR_NAMESPACE are set — bind is ops-only and is not something
 * a fresh SDK.register() identity can do.
 *
 * Run: `bun run checks/origin-operator-read-only.check.ts`
 */
import { SDK } from '../packages/sdk/src/index';
import { assert, info, ok, step } from './lib/report';

async function main() {
  const userToken = process.env.ORIGIN_OPERATOR_USER_TOKEN;
  const namespace = process.env.ORIGIN_OPERATOR_NAMESPACE;
  if (!userToken || !namespace) {
    info(
      'Skipping origin-operator check (set ORIGIN_OPERATOR_USER_TOKEN and ORIGIN_OPERATOR_NAMESPACE after ops bind).',
    );
    return;
  }

  const store = { token: userToken };
  const tokenStorage = {
    get: () => store.token,
    set: (token: string) => {
      store.token = token;
    },
    clear: () => {
      store.token = null;
    },
  };
  const shared = {
    auth: { type: 'jwt' as const },
    platform: 'node' as const,
    origin: namespace,
    tokenStorage,
    retry: { enabled: false },
  };
  const bloque = process.env.BLOQUE_BASE_URL
    ? new SDK({ ...shared, baseUrl: process.env.BLOQUE_BASE_URL })
    : new SDK({ ...shared, mode: 'sandbox' });

  const user = await bloque.authenticate();

  step(`Assume origin ${namespace}`);
  const assumed = await user.orgs.assumeOrigin(namespace);
  assert(assumed.accessToken, 'assumeOrigin did not return an access token');
  ok('assumed origin-operator JWT');

  step('Mint a lookup-only bound key');
  const minted = await user.identity.apiKeys.create({
    name: `e2e-origin-operator-${Date.now()}`,
    scopes: ['identity.read.origin', 'alias.find.origin'],
    domains: [],
    expiration: 'never',
  });
  assert(minted.secretKey, 'mint did not return a secret key');
  ok('minted bound sk_');

  step('Operator JWT must not mint pay/write scopes');
  let escalated = false;
  try {
    await user.identity.apiKeys.create({
      name: 'e2e-should-fail',
      scopes: ['payments.pay'],
      domains: [],
      expiration: 'never',
    });
    escalated = true;
  } catch (err) {
    const status =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status?: number }).status
        : undefined;
    assert(status === 403, `expected 403, got ${status}`);
  }
  assert(!escalated, 'catalog should reject pay/write');
  ok('catalog rejects pay/write');

  step('Exchange without asIdentity');
  const exchanged = await user.identity.apiKeys.exchange({
    key: minted.secretKey,
  });
  assert(exchanged.accessToken, 'exchange failed');
  ok('bound key exchanges for an origin-operator JWT');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

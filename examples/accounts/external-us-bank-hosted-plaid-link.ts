import { SDK } from '../../packages/sdk/src';

/**
 * External US bank → hosted Plaid Link page.
 *
 * Same end goal as `external-us-bank-ach-kusama.ts`, but the user finishes
 * linking on a Bloque-hosted page instead of inside the caller's frontend.
 *
 * Server flow:
 *   1. Pass `returnUrl` (and optionally `state`) to `externalUsBank.create()` —
 *      serialized as `input.return_url` / `input.state` on the mediums API.
 *   2. The server mints a short-lived `plaid-link` JWT, builds a hosted URL,
 *      and returns it as `details.linkUrl`.
 *   3. Send the user to `details.linkUrl` (redirect, email, deep link...).
 *   4. The hosted page runs Plaid Link, exchanges `public_token` on behalf of
 *      the user, then redirects to `returnUrl?status=success&state=<state>`
 *      (or `status=cancelled` / `status=error`).
 *   5. Read final state with `accounts.get(urn)` when the user returns.
 *
 * The `returnUrl` origin must be in the server's `PLAID_LINK_RETURN_URL_ALLOWLIST`.
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: 'sandbox',
  platform: 'node',
});

const user = await bloque.connect('@nestor4');

console.log({
  profile: await user.identity.get(user.urn!),
});

const bank = await user.accounts.externalUsBank.create({
  holderUrn: user.urn,
  ledgerId:
    '0x8a3035ae6d8e9fd867694494d269e94cfa389d17491c63730ed3ee5fb150d251',
  label: 'ACH on-ramp',
  returnUrl: 'https://app.example.com/wallet/plaid-return',
  state: 'user-session-xyz',
});

if (!bank.details.linkUrl) {
  throw new Error(
    'Expected details.linkUrl. Check that returnUrl origin is allowlisted.',
  );
}

console.log('Account URN:           ', bank.urn);
console.log('Hosted Plaid Link URL: ', bank.details.linkUrl);
console.log('linkToken expires at:  ', bank.details.linkTokenExpiration);

// After the user returns to returnUrl?status=success&state=user-session-xyz:
//   const linked = await user.accounts.get(bank.urn);
//   console.log(linked.details.linkStatus); // 'active' | 'pending_link' | ...

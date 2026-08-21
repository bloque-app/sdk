import { SDK } from '../../packages/sdk';

// Lower-level flow for reconnecting to an *existing* identity via an
// interactive assertion challenge, rather than the origin-key session
// `bloque.connect()` used in 1-login-user.ts. Useful when your origin
// authenticates end users directly (e.g. a blockchain signature) instead
// of holding a shared origin key.
const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const alias = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
const origin = bloque.identity.origins.custom('ethereum-mainnet');

// 1. Ask for an assertion challenge.
const challenge = await origin.assert(alias);
console.log('Challenge to sign:', challenge);

// 2. Sign the challenge with the user's own wallet (outside the SDK), then
//    resolve it.
const signature = '0x1234567890abcdef...'; // from the user's wallet

const session = await bloque.identity.origins.connect(alias, 'ethereum-mainnet', {
  assertionResult: {
    alias,
    challengeType: 'SIGNING_CHALLENGE',
    value: { signature, alias },
  },
});

console.log('Connected, access token:', session.accessToken);

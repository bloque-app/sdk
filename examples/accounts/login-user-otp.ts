import { SDK } from '../../packages/sdk/src/index';

/**
 * End-user login via OTP (frontend, `auth: { type: 'jwt' }`).
 *
 * Use this when your own end users log in directly against Bloque (browser
 * or React Native) — no shared origin key ever touches the client. For a
 * backend acting on a user's behalf with a shared origin secret, see
 * `1-login-user.ts` (`auth: { type: 'originKey' }`) instead.
 *
 * Flow: request an OTP for the user's alias (email/phone), the user reads
 * the code from their inbox/SMS, then exchange it for a session.
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: { type: 'jwt' },
  mode: process.env.MODE as 'production' | 'sandbox',
  platform: 'browser',
});

const origin = process.env.ORIGIN!;
const alias = 'nestor@example.com'; // or a phone number

// 1. Trigger the OTP — sent to whichever contact method `alias` resolves to.
const challenge = await bloque.assert(origin, alias);
console.log('OTP sent to:', challenge.value.email ?? challenge.value.phone);

// 2. User enters the code they received; exchange it for a session.
const code = '123456'; // from the user's input

const user = await bloque.connect(origin, alias, code);

console.log('Logged in user:', user.urn);

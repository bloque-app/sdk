import { SDK } from '../../packages/sdk/src/index';

/**
 * Register a passkey again.
 *
 * When a person lost the device that holds their passkey, or an approval
 * fails with `BloqueApprovalInvalidError` and `reason ===
 * 'passkey_not_registered'`, send them to Bloque's identity portal to
 * register a passkey again. The portal brings them back to `returnUrl`.
 *
 * This needs a user session for the person: their own (run it from your
 * frontend with a browser or React Native JWT, as below), or one your
 * backend obtained with your origin's API key. With the latter the link
 * comes back with `verification: 'otp'` and the portal first asks the person
 * for a code sent to their email or phone.
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: { type: 'jwt' },
  platform: 'browser',
  mode: process.env.MODE as 'production' | 'sandbox',
});

// The person's own session: log in with an OTP (see 4-login-user-otp.ts).
const origin = process.env.ORIGIN!;
const alias = 'nestor@example.com';
await bloque.assert(origin, alias);
const code = '123456'; // from the user's input
const user = await bloque.connect(origin, alias, code);

const { url, expiresIn, verification } =
  await user.identity.passkeys.createLink({
    // An https URL whose origin your origin allows.
    returnUrl: 'https://myapp.com/settings/security',
  });

console.log(`Link valid for ${expiresIn}`);
// 'otp': the portal asks the person for a code first; null: no code.
console.log('Verification:', verification);
// In the browser: window.location.assign(url);
console.log('Send the person to:', url);

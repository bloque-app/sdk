import { BloqueVerificationRequiredError } from '../../packages/core/src';
import { SDK } from '../../packages/sdk/src/index';

/**
 * Accept Terms of Service (TOS gate).
 *
 * Most actions that require TOS acceptance (e.g. creating a US bank
 * account) throw `BloqueVerificationRequiredError` with `reason === 'tos'`
 * instead of making you call the gate up front. Catch it, ask for a link,
 * send the user there — no need to hardcode the gate's endpoints.
 *
 * If you're driving the acceptance yourself (no browser redirect available,
 * e.g. a backend-only integration), call `bloque.compliance.tosGate`
 * directly instead — see the manual flow below.
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect('@nestor');

// --- Recommended: catch-and-redirect -------------------------------------
try {
  await user.accounts.us.create({
    /* ...US account params... */
  } as never);
} catch (error) {
  if (
    error instanceof BloqueVerificationRequiredError &&
    error.reason === 'tos'
  ) {
    const link = await error.getVerificationLink({
      returnUrl: 'https://myapp.com/verification-complete',
    });

    if (link) {
      console.log('Send your user to accept the TOS:', link.url);
    }
  } else {
    throw error;
  }
}

// --- Manual flow: drive the gate yourself --------------------------------
// Useful when there's no browser to redirect to and you want to record
// acceptance directly (still shows the document content to the user first).
const gate = await user.compliance.tosGate.start({
  returnUrl: 'https://myapp.com/verification-complete',
});

const { document, csrfToken, passkeyRequired } =
  await user.compliance.tosGate.init({ token: gate.token });

console.log('TOS document version:', document.versionLabel);

if (passkeyRequired) {
  // This document also activates the user's Kreivo PassAccount. Run
  // WebAuthn against `tosGate.challenge({ token: gate.token })` right
  // before accept() and pass the result as `passkey` below. Declining is
  // fine too — accept() without it still records the acceptance.
}

const { acceptance } = await user.compliance.tosGate.accept({
  token: gate.token,
  csrfToken,
});

console.log(
  'TOS accepted:',
  acceptance.documentVersionLabel,
  acceptance.acceptedAt,
);

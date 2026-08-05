import type { BloqueClients } from '../../packages/sdk/src/bloque';
import type { BloqueVerificationRequiredError } from '../../packages/sdk/src/index';
import { extractGateToken } from './gate-token';
import { assert, info, ok, step } from './report';

/**
 * Resolves a `reason: 'tos'` verification gap end-to-end: starts the TOS
 * gate via `getVerificationLink()`, then drives `init()`/`accept()`
 * programmatically with the extracted capability token — exactly what the
 * hosted page itself does, just without a browser.
 */
export async function completeTos(
  clients: BloqueClients,
  error: BloqueVerificationRequiredError,
  returnUrl: string,
): Promise<void> {
  assert(
    error.reason === 'tos',
    `expected reason 'tos', got '${error.reason}'`,
  );

  step('Resolving the TOS gap via error.getVerificationLink()');
  const link = await error.getVerificationLink({ returnUrl });
  assert(link, 'getVerificationLink() returned null for a reason: "tos" error');
  ok(`Got hosted TOS gate URL (expires in ${link.expiresIn})`);
  info(link.url);

  const token = extractGateToken(link.url);

  step('Driving the TOS gate programmatically: GET /init');
  const init = await clients.compliance.tosGate.init({ token });
  ok(
    `Fetched document ${init.document.versionLabel} (${init.document.documentVersionId})`,
  );

  if (init.passkey) {
    // This document requires account activation. The hosted page would run
    // WebAuthn here and submit the result as `accept()`'s `passkey` — a
    // headless check has no authenticator to do that with, so it just
    // declines, same as a real user closing the passkey prompt. The
    // acceptance below still records either way.
    info(
      `This document requires account activation (passkey challenge for ${init.passkey.userName}) — declining it in this check`,
    );
  }

  step('Driving the TOS gate programmatically: POST /accept');
  const accept = await clients.compliance.tosGate.accept({
    token,
    csrfToken: init.csrfToken,
  });
  ok(`TOS accepted at ${accept.acceptance.acceptedAt}`);
  if (accept.acceptance.accountActivation) {
    info(
      `Account activation: attempted=${accept.acceptance.accountActivation.attempted} reason=${accept.acceptance.accountActivation.reason ?? 'n/a'}`,
    );
  }
}

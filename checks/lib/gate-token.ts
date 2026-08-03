/**
 * Both hosted gates put the capability token in the URL *fragment*
 * (`#token=...`) — deliberately, so it's never sent to any server as part
 * of a request (see `TosGateController`/`VerificationGateController`'s
 * class doc comments in payment-rails). The hosted page itself reads it
 * out of `location.hash`; a script driving the same flow programmatically
 * (as these checks do, instead of opening a real browser) extracts it the
 * same way.
 */
export function extractGateToken(gateUrl: string): string {
  const url = new URL(gateUrl);
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const params = new URLSearchParams(hash);
  const token = params.get('token');
  if (!token) {
    throw new Error(
      `Could not extract a capability token from gate URL: ${gateUrl}`,
    );
  }
  return token;
}

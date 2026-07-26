import { createHash } from 'node:crypto';

/**
 * Retries a duplicate money-moving MCP tool call (transport-level retry,
 * client cold-start timeout, etc.) can silently execute the same operation
 * twice, since the SDK's per-request auto-generated Idempotency-Key is
 * random and doesn't survive across independent tool invocations.
 *
 * This derives a stable key from the operation's own parameters instead, so
 * a retry with identical params reuses the same key by construction — the
 * backend rejects the duplicate instead of executing it. Bucketing by time
 * window still lets a deliberately-repeated identical operation (e.g. "send
 * another $50" a few minutes later) through with a fresh key, while
 * absorbing the retry storm a single logical call can produce (HTTP client
 * retries up to ~3 times with exponential backoff capped at 30s).
 *
 * Pass an explicit idempotencyKey from the tool's input schema when the
 * caller wants to control deduplication themselves; this is only the
 * fallback for when they don't.
 */
export function deterministicIdempotencyKey(
  operation: string,
  params: Record<string, unknown>,
  windowMinutes = 5,
): string {
  const bucket = Math.floor(Date.now() / (windowMinutes * 60_000));
  const payload = JSON.stringify({ operation, params, bucket });
  return createHash('sha256').update(payload).digest('hex');
}

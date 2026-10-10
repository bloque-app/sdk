/**
 * @internal
 * A fresh transfer reference: a UUID, or a random fallback where
 * `crypto.randomUUID` is unavailable.
 */
export function generateReference(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `ref_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

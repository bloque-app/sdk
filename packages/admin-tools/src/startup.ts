// Required scopes; each sub-array is "at least one of" — an OR set.
// Strings sourced from payment-rails/server/services/*/policies/.
const REQUIRED_SCOPE_SETS: readonly (readonly string[])[] = [
  ['accounts.read', 'accounts.read.self', 'mediums.read.any'],
  ['accounts.list_transactions', 'accounts.list_transactions.any'],
  ['swap.read', 'swap.admin'],
  ['swap.orders.list', 'swap.admin'],
] as const;

export class JwtScopeError extends Error {
  constructor(public readonly missing: readonly (readonly string[])[]) {
    super(
      `JWT is missing required scopes. Each bullet needs at least one of:\n  - ${missing
        .map((set) => set.join(' | '))
        .join('\n  - ')}`,
    );
    this.name = 'JwtScopeError';
  }
}

interface JwtPayload {
  scopes?: string[];
  scope?: string;
  [k: string]: unknown;
}

function decodePayload(jwt: string): JwtPayload {
  const [, payloadB64] = jwt.split('.');
  if (!payloadB64) throw new Error('JWT is malformed (expected three dot-separated segments)');
  const padded = payloadB64 + '==='.slice((payloadB64.length + 3) % 4);
  const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf-8')) as JwtPayload;
}

export function extractScopes(jwt: string): Set<string> {
  const payload = decodePayload(jwt);
  if (Array.isArray(payload.scopes)) return new Set(payload.scopes);
  if (typeof payload.scope === 'string') return new Set(payload.scope.split(/\s+/).filter(Boolean));
  return new Set();
}

export function verifyJwtScopes(jwt: string): void {
  const held = extractScopes(jwt);
  const missing = REQUIRED_SCOPE_SETS.filter((set) => !set.some((s) => held.has(s)));
  if (missing.length > 0) throw new JwtScopeError(missing);
}

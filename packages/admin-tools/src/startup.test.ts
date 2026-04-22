import { describe, expect, test } from 'bun:test';
import { JwtScopeError, extractScopes, verifyJwtScopes } from './startup.ts';

const makeJwt = (payload: unknown): string => {
  const b64 = Buffer.from(JSON.stringify(payload), 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `HEADER.${b64}.SIG`;
};

describe('extractScopes', () => {
  test('reads a scopes array', () => {
    const scopes = extractScopes(makeJwt({ scopes: ['a', 'b'] }));
    expect([...scopes].sort()).toEqual(['a', 'b']);
  });

  test('reads a space-delimited scope string (OAuth2 style)', () => {
    const scopes = extractScopes(makeJwt({ scope: 'accounts.read  swap.read' }));
    expect([...scopes].sort()).toEqual(['accounts.read', 'swap.read']);
  });

  test('returns an empty set when no scope claim is present', () => {
    expect(extractScopes(makeJwt({ sub: 'user-1' })).size).toBe(0);
  });

  test('throws on a malformed JWT', () => {
    expect(() => extractScopes('not.a.token.really')).toThrow();
    expect(() => extractScopes('onlyonesegment')).toThrow();
  });
});

describe('verifyJwtScopes', () => {
  test('passes when every required OR-set is satisfied', () => {
    const jwt = makeJwt({
      scopes: [
        'accounts.read',
        'accounts.list_transactions',
        'swap.read',
        'swap.orders.list',
      ],
    });
    expect(() => verifyJwtScopes(jwt)).not.toThrow();
  });

  test('accepts `.any` variants for the accounts.list_transactions requirement', () => {
    const jwt = makeJwt({
      scopes: [
        'mediums.read.any',
        'accounts.list_transactions.any',
        'swap.read',
        'swap.orders.list',
      ],
    });
    expect(() => verifyJwtScopes(jwt)).not.toThrow();
  });

  test('treats swap.admin as covering both swap.read and swap.orders.list', () => {
    const jwt = makeJwt({
      scopes: ['accounts.read', 'accounts.list_transactions', 'swap.admin'],
    });
    expect(() => verifyJwtScopes(jwt)).not.toThrow();
  });

  test('lists only the missing OR-sets, not the ones already satisfied', () => {
    const jwt = makeJwt({ scopes: ['accounts.read'] });
    try {
      verifyJwtScopes(jwt);
      throw new Error('expected JwtScopeError');
    } catch (err) {
      expect(err).toBeInstanceOf(JwtScopeError);
      const missing = (err as JwtScopeError).missing.map((set) => [...set]);
      expect(missing).toEqual([
        ['accounts.list_transactions', 'accounts.list_transactions.any'],
        ['swap.read', 'swap.admin'],
        ['swap.orders.list', 'swap.admin'],
      ]);
    }
  });

  test('flags every OR-set when the JWT has no scopes at all', () => {
    try {
      verifyJwtScopes(makeJwt({}));
      throw new Error('expected JwtScopeError');
    } catch (err) {
      expect(err).toBeInstanceOf(JwtScopeError);
      expect((err as JwtScopeError).missing.length).toBe(4);
    }
  });
});

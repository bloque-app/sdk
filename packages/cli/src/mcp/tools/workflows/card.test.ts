import { describe, expect, test } from 'bun:test';
import { extractDomain, matchDomain } from './card.ts';

describe('extractDomain', () => {
  test('extracts domain from full URL', () => {
    expect(extractDomain('https://www.amazon.com/dp/B09V3KXJPB')).toBe('amazon.com');
  });

  test('extracts domain from URL without www', () => {
    expect(extractDomain('https://amazon.com/dp/B09V3KXJPB')).toBe('amazon.com');
  });

  test('extracts domain from http URL', () => {
    expect(extractDomain('http://example.org/path?q=1')).toBe('example.org');
  });

  test('handles bare domain input', () => {
    expect(extractDomain('amazon.com')).toBe('amazon.com');
  });

  test('handles domain with www prefix', () => {
    expect(extractDomain('www.amazon.com')).toBe('amazon.com');
  });

  test('handles subdomain', () => {
    expect(extractDomain('https://ads.google.com')).toBe('ads.google.com');
  });

  test('strips port number', () => {
    expect(extractDomain('http://localhost:3000/path')).toBe('localhost');
  });

  test('strips port from bare domain', () => {
    expect(extractDomain('mysite.com:8080')).toBe('mysite.com');
  });

  test('lowercases the domain', () => {
    expect(extractDomain('AMAZON.COM')).toBe('amazon.com');
  });

  test('returns null for empty string', () => {
    expect(extractDomain('')).toBeNull();
  });

  test('returns null for whitespace-only string', () => {
    expect(extractDomain('   ')).toBeNull();
  });

  test('handles domain with path but no protocol', () => {
    expect(extractDomain('amazon.com/dp/123')).toBe('amazon.com');
  });

  test('handles domain with query but no protocol', () => {
    expect(extractDomain('example.com?foo=bar')).toBe('example.com');
  });

  test('handles domain with fragment but no protocol', () => {
    expect(extractDomain('example.com#section')).toBe('example.com');
  });

  test('trims surrounding whitespace', () => {
    expect(extractDomain('  amazon.com  ')).toBe('amazon.com');
  });
});

describe('matchDomain', () => {
  test('exact match', () => {
    expect(matchDomain('amazon.com', ['amazon.com'])).toBe(true);
  });

  test('subdomain matches parent pattern', () => {
    expect(matchDomain('smile.amazon.com', ['amazon.com'])).toBe(true);
  });

  test('deep subdomain matches parent pattern', () => {
    expect(matchDomain('a.b.c.amazon.com', ['amazon.com'])).toBe(true);
  });

  test('does not match partial domain name', () => {
    expect(matchDomain('notamazon.com', ['amazon.com'])).toBe(false);
  });

  test('specific subdomain pattern does not match parent', () => {
    expect(matchDomain('google.com', ['ads.google.com'])).toBe(false);
  });

  test('specific subdomain pattern matches exactly', () => {
    expect(matchDomain('ads.google.com', ['ads.google.com'])).toBe(true);
  });

  test('www is stripped from domain before matching', () => {
    expect(matchDomain('www.amazon.com', ['amazon.com'])).toBe(true);
  });

  test('www is stripped from pattern before matching', () => {
    expect(matchDomain('amazon.com', ['www.amazon.com'])).toBe(true);
  });

  test('case insensitive matching', () => {
    expect(matchDomain('AMAZON.COM', ['amazon.com'])).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(matchDomain('amazon.com', [])).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(matchDomain('amazon.com', undefined)).toBe(false);
  });

  test('returns false for null', () => {
    expect(matchDomain('amazon.com', null)).toBe(false);
  });

  test('returns false for non-array value', () => {
    expect(matchDomain('amazon.com', 'amazon.com')).toBe(false);
  });

  test('returns false for number', () => {
    expect(matchDomain('amazon.com', 42)).toBe(false);
  });

  test('skips non-string entries in array', () => {
    expect(matchDomain('amazon.com', [123, null, 'amazon.com', undefined])).toBe(true);
  });

  test('returns false when only non-string entries in array', () => {
    expect(matchDomain('amazon.com', [123, null, undefined])).toBe(false);
  });

  test('matches against multiple patterns', () => {
    expect(matchDomain('netflix.com', ['amazon.com', 'netflix.com', 'google.com'])).toBe(true);
  });

  test('no match in multiple patterns', () => {
    expect(matchDomain('spotify.com', ['amazon.com', 'netflix.com'])).toBe(false);
  });
});

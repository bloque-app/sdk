import { describe, expect, test } from 'bun:test';
import { BloqueAPIError } from '@bloque/sdk';
import { logAndFormatToolError } from './bloque-error-mcp.ts';

describe('logAndFormatToolError', () => {
  test('includes raw API response for BloqueAPIError', () => {
    const err = new BloqueAPIError('E_POLICY_VIOLATION', {
      status: 400,
      code: 'E_POLICY_VIOLATION',
      requestId: 'req-test',
      response: {
        message: 'E_POLICY_VIOLATION',
        details: { action: 'create_card', reason: 'example' },
      },
    });
    const out = logAndFormatToolError('create_card', err);
    expect(out.isError).toBe(true);
    const parsed = JSON.parse(out.content[0].text) as {
      kind: string;
      response: unknown;
      requestId?: string;
    };
    expect(parsed.kind).toBe('bloque_api_error');
    expect(parsed.requestId).toBe('req-test');
    expect(parsed.response).toEqual(err.response);
  });

  test('formats generic Error', () => {
    const out = logAndFormatToolError('x', new Error('boom'));
    const parsed = JSON.parse(out.content[0].text) as {
      kind: string;
      message: string;
    };
    expect(parsed.kind).toBe('error');
    expect(parsed.message).toBe('boom');
  });
});

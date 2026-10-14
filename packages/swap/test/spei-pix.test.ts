import { afterEach, describe, expect, it, mock } from 'bun:test';
import { BloqueConfigError, HttpClient } from '@bloque/sdk-core';
import { PixClient } from '../src/pix/pix-client';
import { SpeiClient } from '../src/spei/spei-client';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function authedClient(): HttpClient {
  const http = new HttpClient({
    origin: 'test-origin',
    auth: { type: 'originKey', originKey: 'sk_dev_origin' },
    mode: 'sandbox',
    retry: { enabled: false },
  });
  http.setAccessToken('test_access_token');
  http.setUrn('did:bloque:test:taker');
  return http;
}

function response(how?: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({
      result: {
        order: {
          id: 'order-id',
          order_sig: 'order-sig',
          rate_sig: 'rate-sig',
          swap_sig: 'swap-sig',
          taker: 'did:bloque:test:taker',
          maker: 'did:bloque:service:swap',
          from_asset: 'fiat/2',
          to_asset: 'backed/2',
          from_medium: 'rail',
          to_medium: 'kusama',
          from_amount: '10000',
          to_amount: '9600',
          at: 'now',
          graph_id: 'graph-id',
          status: 'pending',
          created_at: 'now',
          updated_at: 'now',
        },
        execution: how
          ? {
              node_id: 'main',
              result: {
                status: 'paused',
                how,
                callback_token: 'callback-token',
              },
            }
          : undefined,
      },
      req_id: 'request-id',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function captureBody(how?: Record<string, unknown>) {
  let body: Record<string, unknown> | undefined;
  globalThis.fetch = mock(
    (_url: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return Promise.resolve(response(how));
    },
  ) as unknown as typeof fetch;
  return () => body;
}

describe('SPEI contract', () => {
  it('maps the complete pay-in body and SPEI_DEPOSIT response', async () => {
    const body = captureBody({
      type: 'SPEI_DEPOSIT',
      medium: 'spei',
      clabe: '646180157034181180',
      amount: '10000',
      currency: 'MXN',
      reference: 'order-sig',
      expires_at: '2026-10-14T12:00:00.000Z',
    });

    const result = await new SpeiClient(authedClient()).createDeposit({
      rateSig: 'rate-sig',
      amountSrc: '10000',
      depositInformation: {
        urn: 'did:bloque:account:virtual:destination',
        payerName: 'María López',
        payerDocumentNumber: 'LOPM800101ABC',
      },
      metadata: { flow: 'wallet-top-up' },
    });

    expect(body()).toEqual({
      taker_urn: 'did:bloque:test:taker',
      type: 'src',
      rate_sig: 'rate-sig',
      from_medium: 'spei',
      to_medium: 'kusama',
      deposit_information: {
        urn: 'did:bloque:account:virtual:destination',
        payer_name: 'María López',
        payer_document_number: 'LOPM800101ABC',
      },
      args: {},
      amount_src: '10000',
      metadata: { flow: 'wallet-top-up' },
    });
    expect(result.execution?.result.how).toEqual({
      type: 'SPEI_DEPOSIT',
      medium: 'spei',
      clabe: '646180157034181180',
      amount: '10000',
      currency: 'MXN',
      reference: 'order-sig',
      expiresAt: '2026-10-14T12:00:00.000Z',
    });
  });

  it('maps the complete payout body and rejects an invalid CLABE', async () => {
    const body = captureBody();
    const spei = new SpeiClient(authedClient());

    await spei.create({
      rateSig: 'rate-sig',
      type: 'dst',
      amountDst: '5000',
      depositInformation: {
        clabe: '646180157034181180',
        beneficiaryName: 'José Pérez',
        rfc: 'PEPJ8001019Q8',
      },
    });

    expect(body()).toMatchObject({
      type: 'dst',
      from_medium: 'kusama',
      to_medium: 'spei',
      amount_dst: '5000',
      args: {},
      deposit_information: {
        clabe: '646180157034181180',
        beneficiary_name: 'José Pérez',
        rfc: 'PEPJ8001019Q8',
      },
    });
    await expect(
      spei.create({
        rateSig: 'rate-sig',
        amountSrc: '1000',
        depositInformation: {
          clabe: '123',
          beneficiaryName: 'José Pérez',
        },
      }),
    ).rejects.toBeInstanceOf(BloqueConfigError);
  });

  it.each([
    [
      'missing params',
      () => new SpeiClient(authedClient()).createDeposit(undefined as never),
    ],
    [
      'missing rateSig',
      () =>
        new SpeiClient(authedClient()).createDeposit({
          amountSrc: '1000',
          depositInformation: { urn: 'account', payerName: 'Owner' },
        } as never),
    ],
    [
      'missing depositInformation',
      () =>
        new SpeiClient(authedClient()).createDeposit({
          rateSig: 'rate-sig',
          amountSrc: '1000',
        } as never),
    ],
    [
      'missing payerName',
      () =>
        new SpeiClient(authedClient()).createDeposit({
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: { urn: 'account' },
        } as never),
    ],
    [
      'null beneficiaryName',
      () =>
        new SpeiClient(authedClient()).create({
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: {
            clabe: '646180157034181180',
            beneficiaryName: null,
          },
        } as never),
    ],
  ])('returns BloqueConfigError for %s', async (_label, call) => {
    await expect(call()).rejects.toBeInstanceOf(BloqueConfigError);
  });
});

describe('PIX contract', () => {
  it('maps the complete pay-in body and PIX_DEPOSIT response', async () => {
    const body = captureBody({
      type: 'PIX_DEPOSIT',
      medium: 'pix',
      qr_code_payload: '00020101021226890014br.gov.bcb.pix',
      amount: '10000',
      currency: 'BRL',
      reference: 'order-sig',
      expires_at: '2026-10-14T12:00:00.000Z',
    });

    const result = await new PixClient(authedClient()).createDeposit({
      rateSig: 'rate-sig',
      amountSrc: '10000',
      depositInformation: {
        urn: 'did:bloque:account:virtual:destination',
        payerName: 'Ana Silva',
        payerDocumentNumber: '52998224725',
        payerDocumentType: 'CPF',
      },
    });

    expect(body()).toMatchObject({
      from_medium: 'pix',
      to_medium: 'kusama',
      args: {},
      deposit_information: {
        urn: 'did:bloque:account:virtual:destination',
        payer_name: 'Ana Silva',
        payer_document_number: '52998224725',
        payer_document_type: 'CPF',
      },
    });
    expect(result.execution?.result.how).toEqual({
      type: 'PIX_DEPOSIT',
      medium: 'pix',
      qrCodePayload: '00020101021226890014br.gov.bcb.pix',
      amount: '10000',
      currency: 'BRL',
      reference: 'order-sig',
      expiresAt: '2026-10-14T12:00:00.000Z',
    });
  });

  it('maps all PIX payout fields', async () => {
    const body = captureBody();

    await new PixClient(authedClient()).create({
      rateSig: 'rate-sig',
      amountSrc: '10000',
      depositInformation: {
        pixKeyType: 'EMAIL',
        pixKeyValue: 'ana@example.com',
        beneficiaryName: 'Ana Silva',
      },
    });

    expect(body()).toMatchObject({
      from_medium: 'kusama',
      to_medium: 'pix',
      args: {},
      deposit_information: {
        pix_key_type: 'EMAIL',
        pix_key_value: 'ana@example.com',
        beneficiary_name: 'Ana Silva',
      },
    });
  });

  it('keeps payerDocumentType optional without claiming inference', async () => {
    const body = captureBody();

    await new PixClient(authedClient()).createDeposit({
      rateSig: 'rate-sig',
      amountSrc: '10000',
      depositInformation: {
        urn: 'did:bloque:account:virtual:destination',
        payerName: 'Ana Silva',
        payerDocumentNumber: '52998224725',
      },
    });

    expect(body()).toMatchObject({
      deposit_information: {
        urn: 'did:bloque:account:virtual:destination',
        payer_name: 'Ana Silva',
        payer_document_number: '52998224725',
      },
    });
    const requestBody = body();
    if (!requestBody) throw new Error('Expected captured request body.');
    expect(
      (requestBody.deposit_information as Record<string, unknown>)
        .payer_document_type,
    ).toBeUndefined();
  });

  it.each([
    [
      'missing params',
      () => new PixClient(authedClient()).createDeposit(undefined as never),
    ],
    [
      'missing urn',
      () =>
        new PixClient(authedClient()).createDeposit({
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: {
            payerName: 'Owner',
            payerDocumentNumber: '52998224725',
          },
        } as never),
    ],
    [
      'null payerName',
      () =>
        new PixClient(authedClient()).createDeposit({
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: {
            urn: 'account',
            payerName: null,
            payerDocumentNumber: '52998224725',
          },
        } as never),
    ],
    [
      'missing payerDocumentNumber',
      () =>
        new PixClient(authedClient()).createDeposit({
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: { urn: 'account', payerName: 'Owner' },
        } as never),
    ],
    [
      'null pixKeyValue',
      () =>
        new PixClient(authedClient()).create({
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: { pixKeyType: 'EMAIL', pixKeyValue: null },
        } as never),
    ],
  ])('returns BloqueConfigError for %s', async (_label, call) => {
    await expect(call()).rejects.toBeInstanceOf(BloqueConfigError);
  });
});

import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  BloqueApprovalArgsRequiredError,
  HttpClient,
  OPERATION_APPROVAL_HEADER,
  OPERATION_APPROVAL_RETURN_URL_HEADER,
} from '@bloque/sdk-core';
import { BankTransferClient } from '../src/bank-transfer/bank-transfer-client';
import { BrebClient } from '../src/breb/breb-client';
import { ExternalUsBankSwapClient } from '../src/external-us-bank/external-us-bank-client';
import { PixClient } from '../src/pix/pix-client';
import { PseClient } from '../src/pse/pse-client';
import { RtpClient } from '../src/rtp/rtp-client';
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

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type Call = { body: Record<string, unknown>; headers: Headers };

function mockFetch(responses: Array<() => Response>) {
  const calls: Call[] = [];
  globalThis.fetch = mock(
    (_url: string | URL | Request, init?: RequestInit) => {
      calls.push({
        body: JSON.parse(String(init?.body)),
        headers: new Headers(init?.headers),
      });
      const next = responses[Math.min(calls.length - 1, responses.length - 1)];
      return Promise.resolve(next());
    },
  ) as unknown as typeof fetch;
  return calls;
}

const orderOk = () =>
  json(200, {
    result: {
      order: {
        id: '1',
        order_sig: 'order-sig',
        rate_sig: 'rate-sig',
        swap_sig: 's',
        taker: 't',
        maker: 'm',
        from_asset: 'a',
        to_asset: 'b',
        from_medium: 'kusama',
        to_medium: 'breb',
        from_amount: '1',
        to_amount: '1',
        at: 'now',
        graph_id: 'g',
        status: 'pending',
      },
    },
    req_id: 'r',
  });

const params = {
  rateSig: 'rate-sig',
  amountSrc: '1000',
  depositInformation: {
    resolutionId: 'res-1',
    destinationKey: { keyValue: '3001234567', keyType: 'PHONE' as const },
  },
  args: { sourceAccountUrn: 'did:bloque:account:virtual:acc-1' },
};

const orderCreates: Array<
  [string, (http: HttpClient, approval?: string) => Promise<unknown>]
> = [
  [
    'breb.create',
    (http, approval) =>
      new BrebClient(http).create(params, { idempotencyKey: 'k', approval }),
  ],
  [
    'breb.createDeposit',
    (http, approval) =>
      new BrebClient(http).createDeposit(
        {
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: { urn: 'did:bloque:account:virtual:acc-1' },
          args: {},
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
  [
    'pse.create',
    (http, approval) =>
      new PseClient(http).create(
        {
          rateSig: 'rate-sig',
          toMedium: 'kusama',
          amountSrc: '1000',
          depositInformation: { urn: 'did:bloque:account:virtual:acc-1' },
          args: {
            bankCode: '1007',
            userType: 0,
            customerEmail: 'owner@example.com',
            userLegalIdType: 'CC',
            userLegalId: '123',
            customerData: { fullName: 'Owner', phoneNumber: '3001234567' },
            redirectUrl: 'https://example.com/back',
          },
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
  [
    'bankTransfer.create',
    (http, approval) =>
      new BankTransferClient(http).create(
        {
          rateSig: 'rate-sig',
          toMedium: 'bancolombia',
          amountSrc: '1000',
          depositInformation: {
            bankAccountType: 'savings',
            bankAccountNumber: '123',
            bankAccountHolderName: 'Owner',
            bankAccountHolderIdentificationType: 'CC',
            bankAccountHolderIdentificationValue: '123',
          },
          args: { sourceAccountUrn: 'did:bloque:account:virtual:acc-1' },
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
  [
    'rtp.create',
    (http, approval) =>
      new RtpClient(http).create(
        {
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: {
            owner: 'Owner',
            accountNumber: '123',
            routingNumber: '021000021',
            accountType: 'checking',
          },
          args: { sourceAccountUrn: 'did:bloque:account:virtual:acc-1' },
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
  [
    'externalUsBank.create',
    (http, approval) =>
      new ExternalUsBankSwapClient(http).create(
        {
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: { ledgerAccountId: 'ledger-1' },
          args: { sourceAccountUrn: 'did:bloque:account:external-us-bank:1' },
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
  [
    'spei.createDeposit',
    (http, approval) =>
      new SpeiClient(http).createDeposit(
        {
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: {
            urn: 'did:bloque:account:virtual:acc-1',
            payerName: 'Owner Name',
          },
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
  [
    'spei.create',
    (http, approval) =>
      new SpeiClient(http).create(
        {
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: {
            clabe: '646180157034181180',
            beneficiaryName: 'Owner Name',
          },
          args: { sourceAccountUrn: 'did:bloque:account:virtual:acc-1' },
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
  [
    'pix.createDeposit',
    (http, approval) =>
      new PixClient(http).createDeposit(
        {
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: {
            urn: 'did:bloque:account:virtual:acc-1',
            payerName: 'Owner Name',
            payerDocumentNumber: '52998224725',
          },
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
  [
    'pix.create',
    (http, approval) =>
      new PixClient(http).create(
        {
          rateSig: 'rate-sig',
          amountSrc: '1000',
          depositInformation: {
            pixKeyType: 'EMAIL',
            pixKeyValue: 'owner@example.com',
          },
          args: { sourceAccountUrn: 'did:bloque:account:virtual:acc-1' },
        },
        { idempotencyKey: 'k', approval },
      ),
  ],
];

describe('swap order approval', () => {
  it('covers every order create', () => {
    expect(orderCreates).toHaveLength(10);
  });

  it.each(orderCreates)(
    '%s repeats the same body and rate_sig with the approval header',
    async (_name, create) => {
      const calls = mockFetch([orderOk]);
      const http = authedClient();

      await create(http);
      await create(http, 'signed-approval');

      expect(calls[1].body).toEqual(calls[0].body);
      expect(calls[1].body.rate_sig).toBe('rate-sig');
      expect(calls[0].headers.has(OPERATION_APPROVAL_HEADER)).toBe(false);
      expect(calls[1].headers.get(OPERATION_APPROVAL_HEADER)).toBe(
        'signed-approval',
      );
      expect(calls[1].headers.get('Idempotency-Key')).toBe('k');
    },
  );

  it('sends the approval return URL on the first take only', async () => {
    const calls = mockFetch([orderOk]);
    const brebs = new BrebClient(authedClient());
    const returnUrl = 'https://app.example.com/orders/back';

    await brebs.create(params, {
      idempotencyKey: 'k',
      approvalReturnUrl: returnUrl,
    });
    await brebs.create(params, {
      idempotencyKey: 'k',
      approval: 'signed-approval',
      approvalReturnUrl: returnUrl,
    });

    expect(calls[0].headers.get(OPERATION_APPROVAL_RETURN_URL_HEADER)).toBe(
      returnUrl,
    );
    expect(calls[1].headers.has(OPERATION_APPROVAL_RETURN_URL_HEADER)).toBe(
      false,
    );
  });

  it('throws BloqueApprovalArgsRequiredError naming the missing args', async () => {
    mockFetch([
      () =>
        json(422, {
          error: true,
          code: 'E_APPROVAL_ARGS_REQUIRED',
          message: 'E_APPROVAL_ARGS_REQUIRED',
          extra_details: {
            reason: 'first_node_args_required',
            args: ['account_urn'],
          },
        }),
    ]);
    const breb = new BrebClient(authedClient());

    const error = await breb.create(params).catch((e) => e);

    expect(error).toBeInstanceOf(BloqueApprovalArgsRequiredError);
    expect(error.args).toEqual(['account_urn']);
  });
});

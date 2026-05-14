import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountWithBalance,
  CreateAccountRequest,
  CreateAccountResponse,
  ExternalUsBankDetails,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '../internal/wire-types';
import type { CreateAccountOptions } from '../types';
import type {
  CreateExternalUsBankAccountParams,
  ExchangeExternalUsBankPublicTokenParams,
  ExternalUsBankAccount,
  PullExternalUsBankParams,
  PullExternalUsBankResult,
} from './types';

type CreateExternalUsBankInput = {
  label?: string;
  return_url?: string;
  state?: string;
};

type ExchangeExternalUsBankInput = {
  public_token: string;
};

type PullExternalUsBankRequest = {
  amount: string;
  idempotency_key?: string;
};

type PullExternalUsBankResponse = {
  result: {
    order_sig?: string;
    graph_id?: string;
    status?: string;
    execution?: unknown;
  };
  req_id?: string;
};

export function mapExternalUsBankAccountFromWire(
  account: AccountWithBalance<ExternalUsBankDetails>,
): ExternalUsBankAccount {
  return {
    urn: account.urn,
    id: account.id,
    status: account.status,
    ownerUrn: account.owner_urn,
    ledgerId: account.ledger_account_id,
    webhookUrl: account.webhook_url,
    metadata: account.metadata,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
    balance: account.balance,
    details: {
      id: account.details.id,
      linkStatus: account.details.link_status,
      braleAccountId: account.details.brale_account_id,
      braleAddressId: account.details.brale_address_id,
      linkToken: account.details.link_token,
      linkTokenExpiration: account.details.link_token_expiration,
      linkUrl: account.details.link_url,
      jwt: account.details.jwt,
      bankAccountLast4: account.details.bank_account_last4,
      bankName: account.details.bank_name,
      failureReason: account.details.failure_reason,
    },
  };
}

export class ExternalUsBankClient extends BaseClient {
  /**
   * Start the Plaid linkage flow.
   *
   * Two ways to finish linking:
   * - **Hosted page** — pass `returnUrl` (and optionally `state`). The
   *   response includes `details.linkUrl`; open it in a browser and the
   *   page exchanges the Plaid `public_token` on behalf of the user, then
   *   redirects to `returnUrl?status=…&state=…`. Zero frontend code.
   * - **Embedded Plaid Link** — omit `returnUrl`. Use `details.linkToken`
   *   to drive Plaid Link in your own frontend, then call
   *   {@link ExternalUsBankClient.exchangePublicToken} from your backend.
   */
  async create(
    params: CreateExternalUsBankAccountParams,
    _options?: CreateAccountOptions,
  ): Promise<ExternalUsBankAccount> {
    const request: CreateAccountRequest<CreateExternalUsBankInput> = {
      holder_urn: params.holderUrn || this.httpClient.urn || '',
      webhook_url: params.webhookUrl,
      ledger_account_id: params.ledgerId,
      input: {
        label: params.label,
        ...(params.returnUrl !== undefined
          ? { return_url: params.returnUrl }
          : {}),
        ...(params.state !== undefined ? { state: params.state } : {}),
      },
      metadata: {
        source: 'sdk-typescript',
        ...params.metadata,
      },
    };

    const response = await this.httpClient.request<
      CreateAccountResponse<ExternalUsBankDetails>,
      CreateAccountRequest<CreateExternalUsBankInput>
    >({
      method: 'POST',
      path: '/api/mediums/external-us-bank',
      body: request,
    });

    // list/get responses include balance; creation response may not.
    const account = response.result
      .account as unknown as AccountWithBalance<ExternalUsBankDetails>;
    return mapExternalUsBankAccountFromWire(account);
  }

  /**
   * Finish the Plaid linkage flow by exchanging the Plaid `public_token`.
   *
   * Only needed when you drove Plaid Link yourself. If the user completed
   * linking through the hosted page (`details.linkUrl`), the server already
   * exchanged the token on redirect — call {@link AccountsClient.get} on the
   * URN to read the final state instead.
   */
  async exchangePublicToken(
    params: ExchangeExternalUsBankPublicTokenParams,
  ): Promise<ExternalUsBankAccount> {
    const request: UpdateAccountRequest<ExchangeExternalUsBankInput> = {
      input: {
        public_token: params.publicToken,
      },
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<ExternalUsBankDetails>,
      UpdateAccountRequest<ExchangeExternalUsBankInput>
    >({
      method: 'PATCH',
      path: `/api/accounts/${params.urn}`,
      body: request,
    });

    return mapExternalUsBankAccountFromWire(
      response.result
        .account as unknown as AccountWithBalance<ExternalUsBankDetails>,
    );
  }

  /**
   * Pull funds from a linked US bank via Brale ACH debit.
   *
   * Proactively initiates an ACH debit from the user's linked bank account
   * and swaps the proceeds to DUSD on Kusama, teleporting them directly to
   * the caller's Kreivo ledger account that is associated with the linked
   * bank URN.
   *
   * The account must already be in `linkStatus === 'active'` — i.e. Plaid
   * Link has finished and the `public_token` has been exchanged (either via
   * the hosted page redirect or {@link ExternalUsBankClient.exchangePublicToken}).
   *
   * The returned `orderSig` is the stable handle for the swap; use it to
   * correlate webhook events (`swap.order.*`) and to poll the swap service
   * for status.
   *
   * @param params - Pull parameters (URN of the linked bank, USD amount)
   * @returns Snapshot of the created swap order
   *
   * @example
   * ```typescript
   * const order = await user.accounts.externalUsBank.pull({
   *   urn: linked.urn,         // active external-us-bank account
   *   amount: '100.00',        // USD as a decimal string
   * });
   *
   * console.log(order.orderSig);  // "0x…"
   * console.log(order.status);    // "pending"
   * ```
   *
   * @throws BloqueAPIError 400 — invalid amount or `urn`.
   * @throws BloqueAPIError 401 — unauthenticated.
   * @throws BloqueAPIError 403 — the caller does not own the linked bank account.
   * @throws BloqueAPIError 404 — the bank URN has no address mapping yet
   *   (`linkStatus !== 'active'`), or the account has no ledger.
   * @throws BloqueAPIError 503 — no swap rate available for
   *   `external-us-bank → kusama`.
   */
  async pull(
    params: PullExternalUsBankParams,
  ): Promise<PullExternalUsBankResult> {
    if (!params?.urn?.trim()) {
      throw new Error('Bank account URN is required');
    }
    if (typeof params.amount !== 'string' || params.amount.trim() === '') {
      throw new Error(
        'Amount is required and must be a string (e.g. "100.00")',
      );
    }

    const body: PullExternalUsBankRequest = {
      amount: params.amount,
      ...(params.idempotencyKey !== undefined
        ? { idempotency_key: params.idempotencyKey }
        : {}),
    };

    const response = await this.httpClient.request<
      PullExternalUsBankResponse,
      PullExternalUsBankRequest
    >({
      method: 'POST',
      path: `/api/mediums/external-us-bank/${encodeURIComponent(params.urn)}/pull`,
      body,
    });

    return {
      orderSig: response.result?.order_sig,
      graphId: response.result?.graph_id,
      status: response.result?.status,
      execution: response.result?.execution,
      requestId: response.req_id,
    };
  }
}

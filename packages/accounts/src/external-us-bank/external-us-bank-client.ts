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
} from './types';

type CreateExternalUsBankInput = {
  label?: string;
};

type ExchangeExternalUsBankInput = {
  public_token: string;
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
      },
      metadata: {
        source: 'sdk-typescript',
        ...params.metadata,
      },
      return_url: params.returnUrl,
      state: params.state,
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
}

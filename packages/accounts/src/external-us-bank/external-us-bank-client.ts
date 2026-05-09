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
      bankAccountLast4: account.details.bank_account_last4,
      bankName: account.details.bank_name,
      failureReason: account.details.failure_reason,
    },
  };
}

export class ExternalUsBankClient extends BaseClient {
  /**
   * Start the Plaid linkage flow. Returns an account whose `details.linkToken`
   * can be used to initialize Plaid Link on the frontend.
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

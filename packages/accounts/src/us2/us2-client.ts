import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountWithBalance,
  CreateAccountRequest,
  CreateAccountResponse,
  CreateUs2AccountInput,
  ListAccountsResponse,
  UpdateAccountRequest,
  UpdateAccountResponse,
  Us2Details,
  Us2AccountAddress as WireUs2AccountAddress,
  Us2SourceDepositInstructions as WireUs2SourceDepositInstructions,
} from '../internal/wire-types';
import type { CreateAccountOptions } from '../types';
import type {
  CreateUs2AccountParams,
  ListUs2AccountsParams,
  ListUs2AccountsResult,
  UpdateUs2MetadataParams,
  Us2Account,
  Us2SourceDepositInstructions,
} from './types';

function mapSourceDepositInstructionsFromWire(
  instructions?: WireUs2SourceDepositInstructions,
): Us2SourceDepositInstructions | undefined {
  if (!instructions) {
    return undefined;
  }

  return {
    currency: instructions.currency,
    bankName: instructions.bank_name,
    bankAddress: instructions.bank_address,
    bankRoutingNumber: instructions.bank_routing_number,
    bankAccountNumber: instructions.bank_account_number,
    bankBeneficiaryName: instructions.bank_beneficiary_name,
    bankBeneficiaryAddress: instructions.bank_beneficiary_address,
    clabe: instructions.clabe,
  };
}

/**
 * Maps a wire US2 account to the SDK Us2Account type.
 * Exported so AccountsClient.get() can dispatch by medium.
 */
export function mapUs2AccountFromWire(
  account: AccountWithBalance<Us2Details>,
): Us2Account {
  return {
    urn: account.urn,
    id: account.id,
    userId: account.details.user_id,
    virtualAccountId: account.details.virtual_account_id,
    type: account.details.type,
    currency: account.details.currency,
    sourceDepositInstructions: mapSourceDepositInstructionsFromWire(
      account.details.source_deposit_instructions,
    ),
    status: account.status,
    ownerUrn: account.owner_urn,
    ledgerId: account.ledger_account_id,
    webhookUrl: account.webhook_url,
    metadata: account.metadata,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
    balance: account.balance,
  };
}

export class Us2Client extends BaseClient {
  /**
   * Create a new US2 bank account.
   */
  async create(
    params: CreateUs2AccountParams,
    options?: CreateAccountOptions,
  ): Promise<Us2Account> {
    const wireAddress: WireUs2AccountAddress | undefined = params.address
      ? {
          street: params.address.street,
          city: params.address.city,
          state: params.address.state,
          postal_code: params.address.postalCode,
          country: params.address.country,
        }
      : undefined;

    const input: CreateUs2AccountInput = {
      type: params.type,
      email: params.email,
      phone: params.phone,
      tax_id: params.taxId,
      address: wireAddress,
      proof_of_address: params.proofOfAddress,
    };

    const request: CreateAccountRequest<CreateUs2AccountInput> = {
      holder_urn: params.holderUrn || this.httpClient.urn || '',
      webhook_url: params.webhookUrl,
      ledger_account_id: params.ledgerId,
      input,
      metadata: {
        source: 'sdk-typescript',
        name: params.name,
        ...params.metadata,
      },
    };

    const response = await this.httpClient.request<
      CreateAccountResponse<Us2Details>,
      CreateAccountRequest<CreateUs2AccountInput>
    >({
      method: 'POST',
      path: '/api/mediums/us2-account',
      body: request,
    });

    const account = this._mapAccountResponse(response.result.account);

    if (options?.waitLedger) {
      return this._waitForActiveStatus(account.urn, options.timeout || 60000);
    }

    return account;
  }

  /**
   * List US2 bank accounts.
   */
  async list(params?: ListUs2AccountsParams): Promise<ListUs2AccountsResult> {
    const holderUrn = params?.holderUrn || this.httpClient.urn;

    const queryParams = new URLSearchParams();
    queryParams.append('medium', 'us2-account');

    if (holderUrn) {
      queryParams.append('holder_urn', holderUrn);
    }

    if (params?.urn) {
      queryParams.append('urn', params.urn);
    }

    const path = `/api/accounts?${queryParams.toString()}`;

    const response = await this.httpClient.request<
      ListAccountsResponse<Us2Details>
    >({
      method: 'GET',
      path,
    });

    return {
      accounts: response.accounts.map((account) =>
        this._mapAccountResponse(account),
      ),
    };
  }

  /**
   * Update US2 account metadata.
   */
  async updateMetadata(params: UpdateUs2MetadataParams): Promise<Us2Account> {
    const request: UpdateAccountRequest = {
      metadata: params.metadata,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<Us2Details>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${params.urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  /**
   * Activate a US2 account.
   */
  async activate(urn: string): Promise<Us2Account> {
    return this._updateStatus(urn, 'active');
  }

  /**
   * Freeze a US2 account.
   */
  async freeze(urn: string): Promise<Us2Account> {
    return this._updateStatus(urn, 'frozen');
  }

  /**
   * Disable a US2 account.
   */
  async disable(urn: string): Promise<Us2Account> {
    return this._updateStatus(urn, 'disabled');
  }

  private async _waitForActiveStatus(
    urn: string,
    timeout: number,
  ): Promise<Us2Account> {
    const startTime = Date.now();
    const pollingInterval = 2000;

    while (true) {
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Timeout waiting for account to become active. URN: ${urn}`,
        );
      }

      const result = await this.list({ urn });
      const account = result.accounts[0];

      if (!account) {
        throw new Error(`Account not found. URN: ${urn}`);
      }

      if (account.status === 'active') {
        return account;
      }

      if (account.status === 'creation_failed') {
        throw new Error(`Account creation failed. URN: ${urn}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    }
  }

  private async _updateStatus(
    urn: string,
    status: 'active' | 'frozen' | 'disabled',
  ): Promise<Us2Account> {
    const request: UpdateAccountRequest = {
      status,
    };

    const response = await this.httpClient.request<
      UpdateAccountResponse<Us2Details>,
      UpdateAccountRequest
    >({
      method: 'PATCH',
      path: `/api/accounts/${urn}`,
      body: request,
    });

    return this._mapAccountResponse(response.result.account);
  }

  private _mapAccountResponse(
    account: UpdateAccountResponse<Us2Details>['result']['account'],
  ): Us2Account {
    return mapUs2AccountFromWire(account as AccountWithBalance<Us2Details>);
  }
}

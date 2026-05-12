import { BaseClient } from '@bloque/sdk-core';
import type {
  AccountWithBalance,
  CreateAccountRequest,
  CreateAccountResponse,
  CreateUs2AccountInput,
  ListAccountsResponse,
  Us2Details,
} from '../internal/wire-types';
import type { CreateAccountOptions } from '../types';
import type {
  CreateUs2AccountParams,
  ListUs2AccountsParams,
  ListUs2AccountsResult,
  Us2Account,
} from './types';

export function mapUs2AccountFromWire(
  account: AccountWithBalance<Us2Details>,
): Us2Account {
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
      userId: account.details.user_id,
      virtualAccountId: account.details.virtual_account_id,
      type: account.details.type,
      currency: account.details.currency,
    },
  };
}

export class Us2Client extends BaseClient {
  async create(
    params: CreateUs2AccountParams,
    _options?: CreateAccountOptions,
  ): Promise<Us2Account> {
    const input: CreateUs2AccountInput = {
      type: params.type,
      email: params.email,
      phone: params.phone,
      proof_of_address: params.proofOfAddress,
      business_formation_document: params.businessFormationDocument,
      tax_id: params.taxId,
      address: params.address
        ? {
            street: params.address.street,
            city: params.address.city,
            state: params.address.state,
            postal_code: params.address.postalCode,
            country: params.address.country,
          }
        : undefined,
    };

    const request: CreateAccountRequest<CreateUs2AccountInput> = {
      holder_urn: params.holderUrn || this.httpClient.urn || '',
      webhook_url: params.webhookUrl,
      ledger_account_id: params.ledgerId,
      input,
      metadata: {
        source: 'sdk-typescript',
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

    return mapUs2AccountFromWire(
      response.result.account as AccountWithBalance<Us2Details>,
    );
  }

  async list(
    params: ListUs2AccountsParams = {},
  ): Promise<ListUs2AccountsResult> {
    const holderUrn = params.holderUrn || this.httpClient.urn;

    const queryParams = new URLSearchParams();
    queryParams.append('medium', 'us2-account');

    if (holderUrn) queryParams.append('holder_urn', holderUrn);
    if (params.urn) queryParams.append('urn', params.urn);

    const response = await this.httpClient.request<
      ListAccountsResponse<Us2Details>
    >({
      method: 'GET',
      path: `/api/accounts?${queryParams.toString()}`,
    });

    return {
      accounts: response.accounts.map((a) =>
        mapUs2AccountFromWire(a as AccountWithBalance<Us2Details>),
      ),
    };
  }
}

import { BaseClient, BloqueAPIError } from '@bloque/sdk-core';
import type {
  Account,
  AccountWithBalance,
  BrebDetails,
  CreateAccountRequest,
  CreateAccountResponse,
} from '../internal/wire-types';
import type {
  BrebKeyAccount,
  BrebOperationError,
  BrebOperationResult,
  BrebResolvedKey,
  CreateBrebKeyParams,
  ResolveBrebKeyParams,
} from './types';

type CreateBrebKeyRequest = {
  holder_urn: string;
  input: {
    key_type: CreateBrebKeyParams['keyType'];
    key_value: string;
    display_name?: string;
  };
  webhook_url?: string;
  ledger_account_id?: string;
  metadata?: Record<string, unknown>;
};

type ResolveBrebKeyRequest = {
  key_type: ResolveBrebKeyParams['keyType'];
  key: string;
};

type ResolveBrebKeyResponse = BrebResolvedKey;

type BloqueErrorResponse = {
  extra_details?: {
    provider_code?: string;
    message?: string;
  };
};

export function mapBrebAccountFromWire(
  account: Account<BrebDetails> | AccountWithBalance<BrebDetails>,
): BrebKeyAccount {
  return {
    id: account.id,
    urn: account.urn,
    ownerUrn: account.owner_urn,
    medium: 'breb',
    remoteKeyId: account.details.remote_key_id,
    accountId: account.details.account_id,
    keyType: account.details.key.key_type,
    key: account.details.key.key_value,
    displayName: account.details.display_name ?? null,
    status: account.status,
    ledgerId: account.ledger_account_id,
    webhookUrl: account.webhook_url,
    metadata: account.metadata,
    details: account.details,
    balance:
      'balance' in account && account.balance
        ? (account.balance as Record<
            string,
            { current: string; pending: string; in: string; out: string }
          >)
        : undefined,
  };
}

export class BrebClient extends BaseClient {
  private mapError(error: unknown): BrebOperationError {
    if (error instanceof BloqueAPIError) {
      const response = error.response as BloqueErrorResponse | undefined;

      return {
        code: response?.extra_details?.provider_code ?? error.code ?? null,
        message: error.message,
      };
    }

    if (error instanceof Error) {
      return {
        code: null,
        message: error.message,
      };
    }

    return {
      code: null,
      message: 'Unknown BRE-B error',
    };
  }

  /**
   * Create a BRE-B key account by calling the BRE-B key creation endpoint.
   *
   * @example
   * ```ts
   * const key = await bloque.accounts.breb.createKey({
   *   keyType: 'BCODE',
   *   key: '0016027228',
   *   ledgerId: 'ledger-account-breb-001',
   *   displayName: 'Pepito Silva',
   *   metadata: { channel: 'sdk-typescript' },
   * });
   * ```
   */
  async createKey(
    params: CreateBrebKeyParams,
  ): Promise<BrebOperationResult<BrebKeyAccount>> {
    try {
      const holderUrn = this.httpClient.urn;

      if (!holderUrn?.trim()) {
        throw new Error('Holder URN is required');
      }

      if (!params.key?.trim()) {
        throw new Error('BRE-B key value is required');
      }

      const response = await this.httpClient.request<
        CreateAccountResponse<BrebDetails>,
        CreateAccountRequest<CreateBrebKeyRequest['input']>
      >({
        method: 'POST',
        path: '/api/mediums/breb',
        body: {
          holder_urn: holderUrn,
          input: {
            key_type: params.keyType,
            key_value: params.key,
            display_name: params.displayName,
          },
          webhook_url: params.webhookUrl,
          ledger_account_id: params.ledgerId,
          metadata: {
            source: 'sdk-typescript',
            ...params.metadata,
          },
        },
      });

      return {
        data: mapBrebAccountFromWire(response.result.account),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.mapError(error),
      };
    }
  }

  /**
   * Resolve a BRE-B key to obtain recipient and routing information.
   *
   * @example
   * ```ts
   * const resolution = await bloque.accounts.breb.resolveKey({
   *   keyType: 'PHONE',
   *   key: '3123185778',
   * });
   * ```
   */
  async resolveKey(
    params: ResolveBrebKeyParams,
  ): Promise<BrebOperationResult<BrebResolvedKey>> {
    try {
      if (!params.key?.trim()) {
        throw new Error('BRE-B key value is required');
      }

      const response = await this.httpClient.request<
        ResolveBrebKeyResponse,
        ResolveBrebKeyRequest
      >({
        method: 'POST',
        path: '/api/v2/breb/keys/resolve',
        body: {
          key_type: params.keyType,
          key: params.key,
        },
      });

      return {
        data: response,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.mapError(error),
      };
    }
  }
}

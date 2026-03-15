import { BaseClient } from '@bloque/sdk-core';
import type { AccountWithBalance, BrebDetails } from '../internal/wire-types';
import type {
  BrebKeyAccount,
  BrebResolvedKey,
  CreateBrebKeyParams,
  ResolveBrebKeyParams,
} from './types';

type CreateBrebKeyRequest = {
  key_type: CreateBrebKeyParams['keyType'];
  key: string;
  display_name?: string;
  webhook_url?: string;
  ledger_account_id: string;
  metadata?: Record<string, unknown>;
};

type CreateBrebKeyResponse = {
  id: string;
  urn: string;
  ownerUrn: string;
  medium: 'breb';
  remoteKeyId: string;
  accountId: string;
  webhookUrl: string | null;
  ledgerAccountId: string;
  keyType: CreateBrebKeyParams['keyType'];
  key: string;
  displayName: string | null;
  status: BrebKeyAccount['status'];
  details: BrebKeyAccount['details'];
  metadata?: Record<string, unknown>;
};

type ResolveBrebKeyRequest = {
  key_type: ResolveBrebKeyParams['keyType'];
  key: string;
};

type ResolveBrebKeyResponse = BrebResolvedKey;

export function mapBrebAccountFromWire(
  account: AccountWithBalance<BrebDetails>,
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
  async createKey(params: CreateBrebKeyParams): Promise<BrebKeyAccount> {
    if (!params.ledgerId?.trim()) {
      throw new Error('Ledger account ID is required');
    }

    if (!params.key?.trim()) {
      throw new Error('BRE-B key value is required');
    }

    const response = await this.httpClient.request<
      CreateBrebKeyResponse,
      CreateBrebKeyRequest
    >({
      method: 'POST',
      path: '/api/v2/breb/keys',
      body: {
        key_type: params.keyType,
        key: params.key,
        display_name: params.displayName,
        webhook_url: params.webhookUrl,
        ledger_account_id: params.ledgerId,
        metadata: {
          source: 'sdk-typescript',
          ...params.metadata,
        },
      },
    });

    return {
      id: response.id,
      urn: response.urn,
      ownerUrn: response.ownerUrn,
      medium: 'breb',
      remoteKeyId: response.remoteKeyId,
      accountId: response.accountId,
      keyType: response.keyType,
      key: response.key,
      displayName: response.displayName,
      status: response.status,
      ledgerId: response.ledgerAccountId,
      webhookUrl: response.webhookUrl,
      metadata: response.metadata,
      details: response.details,
    };
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
  async resolveKey(params: ResolveBrebKeyParams): Promise<BrebResolvedKey> {
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

    return response;
  }
}

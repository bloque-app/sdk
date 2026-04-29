import { BaseClient, BloqueAPIError } from '@bloque/sdk-core';
import type {
  Account,
  AccountWithBalance,
  BrebDetails,
  CreateAccountRequest,
  CreateAccountResponse,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '../internal/wire-types';
import type {
  ActivateBrebKeyParams,
  ActivateBrebKeyResult,
  BrebDecodedQr,
  BrebKeyAccount,
  BrebOperationError,
  BrebOperationResult,
  BrebResolvedKey,
  CreateBrebKeyParams,
  DecodeBrebQrParams,
  DeleteBrebKeyParams,
  DeleteBrebKeyResult,
  ResolveBrebKeyParams,
  SuspendBrebKeyParams,
  SuspendBrebKeyResult,
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

type ResolveBrebKeyResponse = {
  result: BrebResolvedKey;
  req_id: string;
};

type DecodeBrebQrRequest = {
  qr_code_data: string;
};

type DecodeBrebQrAmount = {
  value: string;
  currency: string;
};

type DecodeBrebQrKey = {
  key_type: ResolveBrebKeyParams['keyType'];
  key_value: string;
};

type DecodeBrebQrMerchant = {
  merchant_category_code: string | null;
  merchant_country: string | null;
  merchant_name: string | null;
  merchant_city: string | null;
  merchant_post_code: string | null;
};

type DecodeBrebQrVat = {
  vat_value: string | null;
  vat_base_value: string | null;
  vat_type: string | null;
};

type DecodeBrebQrInc = {
  inc_value: string | null;
  inc_type: string | null;
};

type DecodeBrebQrAdditionalInfo = {
  transaction_purpose: string | null;
  terminal_label: string | null;
  invoice_number: string | null;
  mobile_phone_number: string | null;
  store_label: string | null;
  loyalty_label: string | null;
  reference_label: string | null;
  customer_label: string | null;
  customer_info: string | null;
  channel_presentation: string | null;
};

type DecodeBrebQrWireResult = {
  amount: DecodeBrebQrAmount | null;
  additional_info: DecodeBrebQrAdditionalInfo | null;
  inc: DecodeBrebQrInc | null;
  key: DecodeBrebQrKey | null;
  qr_code_data: string;
  status: string | null;
  acquirer_network_identifier: string | null;
  merchant: DecodeBrebQrMerchant | null;
  channel: string | null;
  vat: DecodeBrebQrVat | null;
  qr_code_reference: string | null;
  type: string | null;
  resolution_id: string | null;
  resolution: BrebResolvedKey | null;
  raw: Record<string, unknown>;
};

type DecodeBrebQrResponse = {
  result: DecodeBrebQrWireResult;
  req_id: string;
};

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

function mapDecodedQrFromWire(result: DecodeBrebQrWireResult): BrebDecodedQr {
  return {
    amount: result.amount,
    additionalInfo: result.additional_info
      ? {
          transactionPurpose: result.additional_info.transaction_purpose,
          terminalLabel: result.additional_info.terminal_label,
          invoiceNumber: result.additional_info.invoice_number,
          mobilePhoneNumber: result.additional_info.mobile_phone_number,
          storeLabel: result.additional_info.store_label,
          loyaltyLabel: result.additional_info.loyalty_label,
          referenceLabel: result.additional_info.reference_label,
          customerLabel: result.additional_info.customer_label,
          customerInfo: result.additional_info.customer_info,
          channelPresentation: result.additional_info.channel_presentation,
        }
      : null,
    key: result.key
      ? {
          keyType: result.key.key_type,
          keyValue: result.key.key_value,
        }
      : null,
    qrCodeData: result.qr_code_data,
    status: result.status,
    acquirerNetworkIdentifier: result.acquirer_network_identifier,
    merchant: result.merchant
      ? {
          merchantCategoryCode: result.merchant.merchant_category_code,
          merchantCountry: result.merchant.merchant_country,
          merchantName: result.merchant.merchant_name,
          merchantCity: result.merchant.merchant_city,
          merchantPostCode: result.merchant.merchant_post_code,
        }
      : null,
    channel: result.channel,
    qrCodeReference: result.qr_code_reference,
    type: result.type,
    resolutionId: result.resolution_id,
    resolution: result.resolution,
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
        path: '/api/mediums/breb/resolve-key',
        body: {
          key_type: params.keyType,
          key: params.key,
        },
      });

      return {
        data: response.result,
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
   * Decode a BRE-B QR and, for static QRs, include an immediate key resolution.
   *
   * @example
   * ```ts
   * const decoded = await bloque.accounts.breb.decodeQr({
   *   qrCodeData: '000201010212...'
   * });
   * ```
   */
  async decodeQr(
    params: DecodeBrebQrParams,
  ): Promise<BrebOperationResult<BrebDecodedQr>> {
    try {
      if (!params.qrCodeData?.trim()) {
        throw new Error('BRE-B QR code data is required');
      }

      const response = await this.httpClient.request<
        DecodeBrebQrResponse,
        DecodeBrebQrRequest
      >({
        method: 'POST',
        path: '/api/mediums/breb/decode-qr',
        body: {
          qr_code_data: params.qrCodeData,
        },
      });

      return {
        data: mapDecodedQrFromWire(response.result),
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
   * Delete a BRE-B key account previously created in mediums.
   *
   * @example
   * ```ts
   * const result = await bloque.accounts.breb.deleteKey({
   *   accountUrn: 'did:bloque:account:breb:859dc591-f313-44dd-82fd-a5db603a2d6a',
   * });
   * ```
   */
  async deleteKey(
    params: DeleteBrebKeyParams,
  ): Promise<BrebOperationResult<DeleteBrebKeyResult>> {
    try {
      if (!params.accountUrn?.trim()) {
        throw new Error('BRE-B account URN is required');
      }

      const response = await this.httpClient.request<
        UpdateAccountResponse<BrebDetails>,
        UpdateAccountRequest
      >({
        method: 'PATCH',
        path: `/api/accounts/${encodeURIComponent(params.accountUrn)}`,
        body: {
          status: 'deleted',
        },
      });

      return {
        data: {
          deleted: true,
          accountUrn: response.result.account.urn,
          keyId: response.result.account.details.id,
          status: 'deleted',
        },
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
   * Suspend a BRE-B key account.
   *
   * @example
   * ```ts
   * const result = await bloque.accounts.breb.suspendKey({
   *   accountUrn: 'did:bloque:account:breb:859dc591-f313-44dd-82fd-a5db603a2d6a',
   * });
   * ```
   */
  async suspendKey(
    params: SuspendBrebKeyParams,
  ): Promise<BrebOperationResult<SuspendBrebKeyResult>> {
    try {
      if (!params.accountUrn?.trim()) {
        throw new Error('BRE-B account URN is required');
      }

      const response = await this.httpClient.request<
        UpdateAccountResponse<BrebDetails>,
        UpdateAccountRequest
      >({
        method: 'PATCH',
        path: `/api/accounts/${encodeURIComponent(params.accountUrn)}`,
        body: {
          status: 'frozen',
        },
      });

      return {
        data: {
          accountUrn: response.result.account.urn,
          keyId: response.result.account.details.id,
          keyStatus: response.result.account.details.status,
          status: 'frozen',
        },
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
   * Activate a previously suspended BRE-B key account.
   *
   * @example
   * ```ts
   * const result = await bloque.accounts.breb.activateKey({
   *   accountUrn: 'did:bloque:account:breb:859dc591-f313-44dd-82fd-a5db603a2d6a',
   * });
   * ```
   */
  async activateKey(
    params: ActivateBrebKeyParams,
  ): Promise<BrebOperationResult<ActivateBrebKeyResult>> {
    try {
      if (!params.accountUrn?.trim()) {
        throw new Error('BRE-B account URN is required');
      }

      const response = await this.httpClient.request<
        UpdateAccountResponse<BrebDetails>,
        UpdateAccountRequest
      >({
        method: 'PATCH',
        path: `/api/accounts/${encodeURIComponent(params.accountUrn)}`,
        body: {
          status: 'active',
        },
      });

      return {
        data: {
          accountUrn: response.result.account.urn,
          keyId: response.result.account.details.id,
          keyStatus: response.result.account.details.status,
          status: 'active',
        },
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

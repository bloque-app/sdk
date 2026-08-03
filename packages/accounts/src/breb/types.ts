import type { AccountStatus, TokenBalance } from '../types';

export type BrebKeyType = 'ID' | 'PHONE' | 'EMAIL' | 'ALPHA' | 'BCODE';

export interface BrebOperationError {
  /**
   * Provider-specific error code when available.
   */
  code: string | null;

  /**
   * Human-readable error message.
   */
  message: string;
}

export interface BrebOperationResult<T> {
  /**
   * Operation data. Null when the operation failed.
   */
  data: T | null;

  /**
   * Minimal error payload. Null when the operation succeeded.
   */
  error: BrebOperationError | null;
}

export interface CreateBrebKeyParams {
  /**
   * Key type accepted by BRE-B.
   */
  keyType: BrebKeyType;

  /**
   * Value to register for the selected key type. For `keyType: 'ALPHA'`
   * (free-form alias, e.g. your own phone number as an alphanumeric key)
   * the backend requires it to *contain* a recognizable fragment (4+
   * characters) of your own verified name, last name, phone, or email —
   * not an exact match, so e.g. "MiguelBBlo001" (name + abbreviated last
   * name + a number) is fine, but a value with no connection to your own
   * data (e.g. a bank or business name) is rejected. `ID`/`PHONE`/`EMAIL`
   * are your own rail-verified identifiers (BRE-B itself enforces that
   * ownership) and `BCODE` is an entity commercial code, not personal
   * data — neither is checked against your profile.
   */
  key: string;

  /**
   * Passport-only: a friendly name shown during key resolution. Ignored
   * with the active provider (Cobre) — the key's registered/displayed name
   * is always your own verified name, not this field.
   */
  displayName?: string;

  /**
   * Ledger account ID associated with the BRE-B key account.
   */
  ledgerId?: string;

  /**
   * Optional webhook URL to receive events for the stored account.
   */
  webhookUrl?: string;

  /**
   * Arbitrary metadata stored alongside the account.
   *
   * With the active provider (Cobre), `holder_id_number` and
   * `holder_id_type` (e.g. `'cc'`) are effectively required — Cobre key
   * creation fails with `E_COBRE_HOLDER_REQUIRED` without them. Unlike the
   * holder's name (always derived from your verified identity, see `key`
   * above), these two are **not** cross-checked against your own verified
   * ID number — whatever you pass here is trusted as-is. Confirmed live:
   * omitting them fails even for an otherwise fully KYC-verified identity.
   */
  metadata?: Record<string, unknown>;
}

export interface ResolveBrebKeyParams {
  /**
   * Type of key to resolve.
   */
  keyType?: BrebKeyType;

  /**
   * Key value to resolve.
   */
  key: string;
}

export interface DecodeBrebQrParams {
  /**
   * Full BRE-B QR payload to decode.
   */
  qrCodeData: string;
}

export interface DeleteBrebKeyParams {
  /**
   * Local BRE-B account URN to delete.
   */
  accountUrn: string;
}

export interface SuspendBrebKeyParams {
  /**
   * Local BRE-B account URN to suspend.
   */
  accountUrn: string;
}

export interface ActivateBrebKeyParams {
  /**
   * Local BRE-B account URN to activate.
   */
  accountUrn: string;
}

export interface DeleteBrebKeyResult {
  /**
   * Whether the key was deleted successfully.
   */
  deleted: true;

  /**
   * Local BRE-B account URN that was deleted.
   */
  accountUrn: string;

  /**
   * Remote BRE-B key id deleted upstream.
   */
  keyId: string;

  /**
   * Final local account status.
   */
  status: 'deleted';
}

export interface SuspendBrebKeyResult {
  /**
   * Local BRE-B account URN that was suspended.
   */
  accountUrn: string;

  /**
   * Remote BRE-B key id updated upstream.
   */
  keyId: string;

  /**
   * Upstream BRE-B key status.
   */
  keyStatus: string;

  /**
   * Final local account status.
   */
  status: 'frozen';
}

export interface ActivateBrebKeyResult {
  /**
   * Local BRE-B account URN that was activated.
   */
  accountUrn: string;

  /**
   * Remote BRE-B key id updated upstream.
   */
  keyId: string;

  /**
   * Upstream BRE-B key status.
   */
  keyStatus: string;

  /**
   * Final local account status.
   */
  status: 'active';
}

export interface BrebKeyAccount {
  /**
   * Local account identifier.
   */
  id: string;

  /**
   * Account URN.
   */
  urn: string;

  /**
   * Owner URN associated with the account.
   */
  ownerUrn: string;

  /**
   * Medium identifier.
   */
  medium: 'breb';

  /**
   * Remote BRE-B key id returned by the source system.
   */
  remoteKeyId: string;

  /**
   * Source account id used against BRE-B.
   */
  accountId: string;

  /**
   * Stored key type.
   */
  keyType: BrebKeyType;

  /**
   * Stored key value.
   */
  key: string;

  /**
   * Friendly display name.
   */
  displayName: string | null;

  /**
   * Account status.
   */
  status: AccountStatus;

  /**
   * Ledger account id associated with the key.
   */
  ledgerId: string;

  /**
   * Webhook URL configured for the account.
   */
  webhookUrl: string | null;

  /**
   * Custom metadata.
   */
  metadata?: Record<string, unknown>;

  /**
   * Raw details returned/stored for this account.
   */
  details: {
    id: string;
    remote_key_id: string;
    account_id: string;
    key: {
      key_type: BrebKeyType;
      key_value: string;
    };
    display_name: string | null;
    status: string;
    created_at: string | null;
    updated_at: string | null;
    raw_response: Record<string, unknown>;
  };

  /**
   * Optional balances when fetched from /api/accounts.
   */
  balance?: Record<string, TokenBalance>;
}

export interface BrebResolvedKey {
  /**
   * Resolution id returned by BRE-B.
   */
  id: string;

  /**
   * Alias of id for payment flows.
   */
  resolutionId: string;

  /**
   * Customer who initiated the resolution.
   */
  customerId: string;

  /**
   * Resolved key information.
   */
  key: {
    keyType: BrebKeyType;
    keyValue: string;
  };

  /**
   * Owner information for the payee.
   */
  owner: {
    identificationType: string | null;
    identificationNumber: string | null;
    firstName: string | null;
    secondName: string | null;
    firstLastName: string | null;
    secondLastName: string | null;
    type: string | null;
    businessName: string | null;
    name: string | null;
  } | null;

  /**
   * Participant information returned by BRE-B.
   */
  participant: {
    name: string | null;
    identificationNumber: string | null;
  } | null;

  /**
   * Account information returned by BRE-B.
   */
  account: {
    accountNumber: string | null;
    accountType: string | null;
  } | null;

  /**
   * Target node that should receive the payment.
   */
  receptorNode: string | null;

  /**
   * Resolution timestamp.
   */
  resolvedAt: string | null;

  /**
   * Expiration timestamp for the resolution.
   */
  expiresAt: string | null;

  /**
   * Raw BRE-B payload.
   */
  raw: Record<string, unknown>;
}

export interface BrebDecodedQrAmount {
  value: string;
  currency: string;
}

export interface BrebDecodedQrKey {
  keyType: BrebKeyType;
  keyValue: string;
}

export interface BrebDecodedQrMerchant {
  merchantCategoryCode: string | null;
  merchantCountry: string | null;
  merchantName: string | null;
  merchantCity: string | null;
  merchantPostCode: string | null;
}

export interface BrebDecodedQrAdditionalInfo {
  transactionPurpose: string | null;
  terminalLabel: string | null;
  invoiceNumber: string | null;
  mobilePhoneNumber: string | null;
  storeLabel: string | null;
  loyaltyLabel: string | null;
  referenceLabel: string | null;
  customerLabel: string | null;
  customerInfo: string | null;
  channelPresentation: string | null;
}

export interface BrebDecodedQr {
  amount: BrebDecodedQrAmount | null;
  additionalInfo: BrebDecodedQrAdditionalInfo | null;
  key: BrebDecodedQrKey | null;
  qrCodeData: string;
  status: string | null;
  acquirerNetworkIdentifier: string | null;
  merchant: BrebDecodedQrMerchant | null;
  channel: string | null;
  qrCodeReference: string | null;
  type: string | null;
  resolutionId: string | null;
  resolution: BrebResolvedKey | null;
}

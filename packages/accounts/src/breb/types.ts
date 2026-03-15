import type { AccountStatus, TokenBalance } from '../types';

export type BrebKeyType = 'ID' | 'PHONE' | 'EMAIL' | 'ALPHA' | 'BCODE';

export interface CreateBrebKeyParams {
  /**
   * Key type accepted by BRE-B.
   */
  keyType: BrebKeyType;

  /**
   * Value to register for the selected key type.
   */
  key: string;

  /**
   * Friendly name shown during key resolution.
   */
  displayName?: string;

  /**
   * Ledger account ID associated with the BRE-B key account.
   */
  ledgerId: string;

  /**
   * Optional webhook URL to receive events for the stored account.
   */
  webhookUrl?: string;

  /**
   * Arbitrary metadata stored alongside the account.
   */
  metadata?: Record<string, unknown>;
}

export interface ResolveBrebKeyParams {
  /**
   * Type of key to resolve.
   */
  keyType: BrebKeyType;

  /**
   * Key value to resolve.
   */
  key: string;
}

export interface BrebKeyAccount {
  /**
   * Local account identifier.
   */
  id: string;

  /**
   * Account URN in mediums.
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
   * Remote BRE-B key id returned by Passport.
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

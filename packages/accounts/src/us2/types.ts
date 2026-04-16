import type { TokenBalance } from '../internal/wire-types';

/**
 * Address information accepted for US2 account onboarding.
 */
export interface Us2AccountAddress {
  /** Street address */
  street: string;
  /** City */
  city: string;
  /** State or region */
  state: string;
  /** Postal code */
  postalCode: string;
  /** ISO country code */
  country: string;
}

/**
 * Proof-of-address payload required for individual US2 onboarding.
 * The provider payload is not yet fully normalized by the public API.
 */
export type Us2ProofOfAddress = Record<string, unknown>;

/**
 * Parameters for creating a US2 account.
 */
export interface CreateUs2AccountParams {
  /** URN of the account holder (user or organization) */
  holderUrn?: string;
  /** First-pass support is limited to individual accounts */
  type: 'individual';
  /** Contact email */
  email: string;
  /** Contact phone number */
  phone?: string;
  /** Tax identifier when available */
  taxId?: string;
  /** Mailing address */
  address?: Us2AccountAddress;
  /** Provider-specific proof-of-address document payload */
  proofOfAddress: Us2ProofOfAddress;
  /** Display name stored in metadata */
  name?: string;
  /** Webhook URL to receive account events */
  webhookUrl?: string;
  /** Ledger account ID to associate with this account */
  ledgerId?: string;
  /** Custom metadata to associate with the account */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for listing US2 accounts.
 */
export interface ListUs2AccountsParams {
  /** URN of the account holder to filter by */
  holderUrn?: string;
  /** Specific US2 account URN to retrieve */
  urn?: string;
}

/**
 * Result of listing US2 accounts.
 */
export interface ListUs2AccountsResult {
  /** Array of US2 accounts with balance information */
  accounts: Us2Account[];
}

/**
 * Parameters for updating US2 account metadata.
 */
export interface UpdateUs2MetadataParams {
  /** URN of the US2 account to update */
  urn: string;
  /** Metadata to update */
  metadata: Record<string, unknown>;
}

/**
 * Bank instruction details returned after virtual-account provisioning.
 */
export interface Us2SourceDepositInstructions {
  currency?: string;
  bankName?: string;
  bankAddress?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  bankBeneficiaryName?: string;
  bankBeneficiaryAddress?: string;
  clabe?: string;
}

/**
 * Public US2 account representation.
 */
export interface Us2Account {
  /** Unique resource name for the US2 account */
  urn: string;
  /** Account ID */
  id: string;
  /** Provider user ID */
  userId: string;
  /** Provisioned virtual account ID when available */
  virtualAccountId?: string;
  /** Backing account type returned by the provider */
  type: string;
  /** Account currency */
  currency: string;
  /** Bank instructions shown once provisioning completes */
  sourceDepositInstructions?: Us2SourceDepositInstructions;
  /** Current status of the account */
  status:
    | 'active'
    | 'disabled'
    | 'frozen'
    | 'deleted'
    | 'creation_in_progress'
    | 'creation_failed';
  /** Owner URN */
  ownerUrn: string;
  /** Ledger account ID associated with this account */
  ledgerId: string;
  /** Webhook URL (if configured) */
  webhookUrl: string | null;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Token balances (only included in list responses) */
  balance?: Record<string, TokenBalance>;
}

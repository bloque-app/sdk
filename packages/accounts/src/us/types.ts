import type { TokenBalance, UsAccountType } from '../internal/wire-types';

/**
 * Address information for US account creation
 */
export interface UsAccountAddress {
  /**
   * Street address line 1
   * @example "456 Wall Street"
   */
  streetLine1: string;
  /**
   * Street address line 2 (optional)
   * @example "Suite 789"
   */
  streetLine2?: string;
  /**
   * City
   * @example "New York"
   */
  city: string;
  /**
   * State code (2 letters)
   * @example "NY"
   */
  state: string;
  /**
   * Postal code
   * @example "10005"
   */
  postalCode: string;
  /**
   * Country code (2 letters)
   * @example "US"
   */
  country: string;
}

/**
 * Parameters for creating a US account
 */
export interface CreateUsAccountParams {
  /**
   * URN of the account holder (user or organization)
   * @internal - Not exposed in public documentation
   */
  holderUrn?: string;
  /**
   * Account type (individual or business)
   * @example "individual"
   */
  type: UsAccountType;
  /**
   * First name
   * @example "Robert"
   */
  firstName: string;
  /**
   * Middle name (optional)
   * @example "James"
   */
  middleName?: string;
  /**
   * Last name
   * @example "Johnson"
   */
  lastName: string;
  /**
   * Email address
   * @example "robert.johnson@example.com"
   */
  email: string;
  /**
   * Phone number with country code
   * @example "+12125551234"
   */
  phone: string;
  /**
   * Address information
   */
  address: UsAccountAddress;
  /**
   * Birth date in YYYY-MM-DD format
   * @example "1985-03-15"
   */
  birthDate: string;
  /**
   * Tax identification number (SSN for individuals, EIN for businesses)
   * @example "123-45-6789"
   */
  taxIdentificationNumber: string;
  /**
   * Government ID issuing country (2-letter code)
   * @example "US"
   */
  govIdCountry: string;
  /**
   * Base64-encoded image of government ID front
   */
  govIdImageFront: string;
  /**
   * Signed agreement ID obtained from getTosLink
   * @example "0d139f8e-14b0-4540-92ba-4e66c619b533"
   */
  signedAgreementId: string;
  /**
   * Webhook URL to receive account events
   */
  webhookUrl?: string;
  /**
   * Ledger account ID to associate with this account
   */
  ledgerId?: string;
  /**
   * Custom metadata to associate with the account
   */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for getting TOS link
 */
export interface GetTosLinkParams {
  /**
   * Redirect URI after user accepts terms of service
   * @example "https://myapp.com/callback"
   */
  redirectUri: string;
}

/**
 * Result of getting TOS link
 */
export interface TosLinkResult {
  /**
   * URL to redirect user to accept terms of service
   * @example "https://dashboard.bridge.xyz/accept-terms-of-service?session_token=4d5d8c45-9feb-422a-bb5e-0fd32e3b3c53"
   */
  url: string;
}

/**
 * Parameters for listing US accounts
 */
export interface ListUsAccountsParams {
  /**
   * URN of the account holder (user or organization) to filter by
   * @example "did:bloque:bloque-root:nestor"
   */
  holderUrn?: string;

  /**
   * URN of a specific US account to retrieve
   * @example "did:bloque:account:us-account:usr-123:us-456"
   */
  urn?: string;
}

/**
 * Result of listing US accounts
 */
export interface ListUsAccountsResult {
  /** Array of US accounts with balance information */
  accounts: UsAccount[];
}

/**
 * Parameters for updating US account metadata
 */
export interface UpdateUsMetadataParams {
  /**
   * URN of the US account to update
   * @example "did:bloque:mediums:us-account:account:123e4567"
   */
  urn: string;
  /**
   * Metadata to update
   */
  metadata: Record<string, unknown>;
}

/**
 * US account information
 */
export interface UsAccount {
  /**
   * Unique resource name for the US account
   */
  urn: string;
  /**
   * US account ID
   */
  id: string;
  /**
   * Account type (individual or business)
   */
  type: UsAccountType;
  /**
   * First name
   */
  firstName: string;
  /**
   * Middle name (if provided)
   */
  middleName?: string;
  /**
   * Last name
   */
  lastName: string;
  /**
   * Email address
   */
  email: string;
  /**
   * Phone number
   */
  phone: string;
  /**
   * Address information
   */
  address: UsAccountAddress;
  /**
   * Birth date in YYYY-MM-DD format
   */
  birthDate: string;
  /**
   * Bank account number (if available)
   */
  accountNumber?: string;
  /**
   * Bank routing number (if available)
   */
  routingNumber?: string;
  /**
   * Current status of the account
   */
  status:
    | 'active'
    | 'disabled'
    | 'frozen'
    | 'deleted'
    | 'creation_in_progress'
    | 'creation_failed';
  /**
   * Owner URN
   */
  ownerUrn: string;
  /**
   * Ledger account ID associated with this account
   */
  ledgerId: string;
  /**
   * Webhook URL (if configured)
   */
  webhookUrl: string | null;
  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
  /**
   * Creation timestamp
   */
  createdAt: string;
  /**
   * Last update timestamp
   */
  updatedAt: string;
  /**
   * Token balances (only included in list responses)
   */
  balance?: Record<string, TokenBalance>;
}

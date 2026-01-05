import type {
  CardType,
  TokenBalance,
  Transaction,
} from '../internal/wire-types';
import type { SupportedAsset } from '../types';

/**
 * Parameters for listing card accounts
 */
export interface ListCardAccountsParams {
  /**
   * URN of the account holder (user or organization) to filter by
   * @example "did:bloque:bloque-root:nestor"
   */
  holderUrn?: string;

  /**
   * URN of a specific card account to retrieve
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  urn?: string;
}

/**
 * Result of listing card accounts
 */
export interface ListCardAccountsResult {
  /** Array of card accounts with balance information */
  accounts: CardAccount[];
}

// Deprecated: Use ListCardAccountsParams instead
export interface ListCardParams {
  /**
   * URN of the account holder (user or organization)
   *
   * @example "did:bloque:user:123e4567"
   */
  holderUrn?: string;
}

export interface ListMovementsParams {
  /**
   * URN of the card account
   *
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  urn: string;
  /**
   * Asset to filter transactions by
   *
   * @example "USD" (defaults to "USD" if "USD" is provided)
   */
  asset?: SupportedAsset;
  /**
   * Maximum number of transactions to return
   *
   * @example 50
   */
  limit?: number;
  /**
   * Filter transactions before this date (ISO 8601)
   *
   * @example "2025-01-01T00:00:00Z"
   */
  before?: string;
  /**
   * Filter transactions after this date (ISO 8601)
   *
   * @example "2025-01-01T00:00:00Z"
   */
  after?: string;
  /**
   * Filter by transaction reference
   *
   * @example "0xbff43fa587e0efa275f8b643d95881713c0f0ee13682d049cc452f607241b752"
   */
  reference?: string;
  /**
   * Filter by transaction direction
   * - 'in' for incoming funds (deposits, transfers received)
   * - 'out' for outgoing funds (withdrawals, transfers sent)
   */
  direction?: 'in' | 'out';
}

export interface CardMovement extends Transaction {
  // Extends Transaction from api-types
}

export interface GetBalanceParams {
  /**
   * URN of the card account
   *
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  urn: string;
}

export interface CreateCardParams {
  /**
   * URN of the account holder (user or organization)
   *
   * @example "did:bloque:user:123e4567"
   */
  holderUrn?: string;
  /**
   * Display name for the card
   */
  name?: string;
  /**
   * Webhook URL to receive card events
   */
  webhookUrl?: string;
  /**
   * Ledger account ID to associate with the card
   */
  ledgerId?: string;
  /**
   * Custom metadata to associate with the card
   */
  metadata?: Record<string, unknown>;
}

export interface UpdateCardMetadataParams {
  /**
   * URN of the card account to update
   *
   * @example "did:bloque:mediums:card:account:123e4567"
   */
  urn: string;
  /**
   * Metadata to update (name and source are reserved fields and cannot be modified)
   */
  metadata: Record<string, unknown> & {
    name?: never;
    source?: never;
  };
}

export interface CardAccount {
  /**
   * Unique resource name for the card account
   */
  urn: string;
  /**
   * Card account ID
   */
  id: string;
  /**
   * Last four digits of the card
   */
  lastFour: string;
  /**
   * Type of card product (CREDIT, DEBIT)
   */
  productType: 'CREDIT' | 'DEBIT';
  /**
   * Current status of the card
   */
  status:
    | 'active'
    | 'disabled'
    | 'frozen'
    | 'deleted'
    | 'creation_in_progress'
    | 'creation_failed';
  /**
   * Type of card (VIRTUAL, PHYSICAL)
   */
  cardType: CardType;
  /**
   * URL to view card details (PCI-compliant)
   */
  detailsUrl: string;

  /**
   * Owner URN
   */
  ownerUrn: string;
  /**
   * Ledger account ID associated with the card
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

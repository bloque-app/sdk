/**
 * Public types for @bloque/sdk-accounts
 */

/**
 * Options for account creation
 */
export interface CreateAccountOptions {
  /**
   * If true, wait for the account to become active before returning
   * This will poll the account status every second until it's active
   * @default false
   */
  waitLedger?: boolean;

  /**
   * Maximum time to wait in milliseconds (only applies when waitLedger is true)
   * @default 60000 (60 seconds)
   */
  timeout?: number;
}

/**
 * Supported asset types for transfers and movements
 */
export type SupportedAsset = 'DUSD/6' | 'KSM/12';

/**
 * Parameters for transferring funds between accounts
 */
export interface TransferParams {
  /**
   * URN of the source account
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  sourceUrn: string;
  /**
   * URN of the destination account
   * @example "did:bloque:account:virtual:acc-67890"
   */
  destinationUrn: string;
  /**
   * Amount to transfer (as string to preserve precision)
   * @example "1000000000000"
   */
  amount: string;
  /**
   * Asset to transfer
   * @example "DUSD/6"
   */
  asset: SupportedAsset;
  /**
   * Optional metadata for the transfer
   * @example { reference: "payment-123", note: "Monthly subscription" }
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a transfer operation
 */
export interface TransferResult {
  /** Unique identifier for the queued transfer */
  queueId: string;
  /** Current status of the transfer */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  /** Human-readable message about the transfer status */
  message: string;
}

/**
 * Account status
 */
export type AccountStatus =
  | 'active'
  | 'disabled'
  | 'frozen'
  | 'deleted'
  | 'creation_in_progress'
  | 'creation_failed';

/**
 * Account medium/type
 */
export type AccountMedium = 'bancolombia' | 'card' | 'virtual' | 'polygon';

/**
 * Token balance information
 */
export interface TokenBalance {
  /** Current balance */
  current: string;
  /** Pending balance */
  pending: string;
  /** Incoming amount */
  in: string;
  /** Outgoing amount */
  out: string;
}

/**
 * Generic account response
 * Details type varies based on account medium
 */
export interface Account<TDetails = unknown> {
  /** Unique account identifier */
  id: string;
  /** Unique resource name for the account */
  urn: string;
  /** Account type/medium */
  medium: AccountMedium;
  /** Account-specific details (structure varies by medium) */
  details: TDetails;
  /** Ledger account ID */
  ledgerId: string;
  /** Account status */
  status: AccountStatus;
  /** Owner URN */
  ownerUrn: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Webhook URL (if configured) */
  webhookUrl: string | null;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Token balances by asset */
  balance: Record<string, TokenBalance>;
}

/**
 * Parameters for listing accounts
 */
export interface ListAccountsParams {
  /**
   * URN of the account holder (user or organization) to filter by
   * @example "did:bloque:bloque-root:nestor"
   */
  holderUrn?: string;

  /**
   * Specific account URN to retrieve
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  urn?: string;

  /**
   * Account medium/type to filter by
   */
  medium?: AccountMedium;
}

/**
 * Result of listing accounts
 */
export interface ListAccountsResult {
  /** Array of accounts */
  accounts: Account[];
}

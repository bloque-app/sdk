/**
 * Public types for @bloque/sdk-accounts
 */

import type { SupportedAsset } from '@bloque/sdk-core';
import type { TransactionStatus } from './internal/wire-types';

// Re-export SupportedAsset from core
export type { SupportedAsset } from '@bloque/sdk-core';

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
 * Single operation in a batch transfer
 */
export interface BatchTransferOperation {
  /**
   * URN of the source account
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  fromUrn: string;
  /**
   * URN of the destination account
   * @example "did:bloque:account:virtual:acc-67890"
   */
  toUrn: string;
  /**
   * Unique reference ID for tracking this operation
   * @example "transfer-001"
   */
  reference: string;
  /**
   * Amount to transfer (as string to preserve precision)
   * @example "1000000000000"
   */
  amount: string;
  /**
   * Asset to transfer
   * @example "KSM/12"
   */
  asset: SupportedAsset;
  /**
   * Optional per-operation metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for batch transfer
 */
export interface BatchTransferParams {
  /**
   * Array of transfer operations to execute
   */
  operations: BatchTransferOperation[];
  /**
   * Unique reference ID for the entire batch
   * @example "batch-payroll-2024-01-15"
   */
  reference: string;
  /**
   * Optional batch-level metadata
   */
  metadata?: Record<string, unknown>;
  /**
   * Optional webhook URL to receive settlement notifications
   */
  webhookUrl?: string;
}

/**
 * Result of a single chunk in a batch transfer
 */
export interface BatchTransferChunkResult {
  /** Unique identifier for the queued chunk */
  queueId: string;
  /** Current status of the chunk */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  /** Human-readable message about the chunk status */
  message: string;
}

/**
 * Result of a batch transfer operation
 */
export interface BatchTransferResult {
  /** Array of chunk results */
  chunks: BatchTransferChunkResult[];
  /** Total number of operations in the batch */
  totalOperations: number;
  /** Total number of chunks the batch was split into */
  totalChunks: number;
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
export type AccountMedium =
  | 'bancolombia'
  | 'card'
  | 'virtual'
  | 'polygon'
  | 'us-account';

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
 * Token balance information for aggregated/general balances.
 * Some assets may only include current and pending values.
 */
export interface GeneralTokenBalance {
  /** Current balance */
  current: string;
  /** Pending balance */
  pending: string;
  /** Incoming amount (optional in aggregated responses) */
  in?: string;
  /** Outgoing amount (optional in aggregated responses) */
  out?: string;
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
 * Result of listing accounts.
 * Each account is mapped to its medium-specific type
 * (CardAccount, VirtualAccount, PolygonAccount, BancolombiaAccount, or UsAccount).
 */
export interface ListAccountsResult {
  /** Array of medium-specific mapped accounts */
  accounts: Array<
    | import('./card/types').CardAccount
    | import('./virtual/types').VirtualAccount
    | import('./polygon/types').PolygonAccount
    | import('./bancolombia/types').BancolombiaAccount
    | import('./us/types').UsAccount
  >;
}

/**
 * Transaction type (deposit, withdraw, transfer)
 */
export type MovementType = 'deposit' | 'withdraw' | 'transfer';

/**
 * Transaction details metadata
 */
export interface MovementDetails {
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Transaction type */
  type?: string;
}

/**
 * Account movement/transaction
 */
export interface Movement {
  /** Settlement status of the movement */
  status: TransactionStatus;
  /** Transaction amount */
  amount: string;
  /** Asset type */
  asset: string;
  /** Source account ID */
  fromAccountId: string;
  /** Destination account ID */
  toAccountId: string;
  /** Transaction direction */
  direction: 'in' | 'out';
  /** Transaction type (deposit, withdraw, transfer) */
  type: MovementType;
  /** Transaction reference */
  reference: string;
  /** Rail/network name */
  railName: string;
  /** Transaction details */
  details: MovementDetails;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Paged result for list movements
 */
export interface ListMovementsResult {
  /** Array of movements */
  data: Movement[];
  /** Number of results in this page */
  pageSize: number;
  /** Whether more results are available */
  hasMore: boolean;
  /** Pagination token for the next page (if hasMore is true) */
  next?: string;
}

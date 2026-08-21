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
  /**
   * Custom idempotency key used for account creation POST requests.
   */
  idempotencyKey?: string;
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

export interface TransferOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
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

export interface BatchTransferOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
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
  /**
   * `'executed'` — all effective operations were queued (including the
   * ready portion of a mixed batch). `'deferred'` — every account is still
   * being created; the whole batch was rescheduled for retry.
   * `'failed'` — the batch exhausted all retry attempts.
   */
  status: 'executed' | 'deferred' | 'failed';
  /** Array of chunk results */
  chunks: BatchTransferChunkResult[];
  /** Total number of operations in the batch */
  totalOperations: number;
  /** Total number of chunks the batch was split into */
  totalChunks: number;
}

// ---------------------------------------------------------------------------
// Batch-transfer webhooks — POSTed to `webhookUrl` for both the batch's own
// lifecycle events and each chunk's settlement. Not returned by any client
// method; these types are for consumers who verify/parse the webhook body
// themselves.
// ---------------------------------------------------------------------------

/** Lifecycle event fired over the course of a batch transfer's execution. */
export type BatchTransferWebhookEvent =
  | 'batch_transfer.completed'
  | 'batch_transfer.operations_deferred'
  | 'batch_transfer.retry_attempt'
  | 'batch_transfer.failed';

/**
 * Body POSTed to `webhookUrl` for a batch-level lifecycle event. Signed
 * with `x-bloque-signature` (HMAC-SHA256 over the JSON body) when the
 * origin has a webhook secret configured.
 */
export interface BatchTransferLifecycleWebhookPayload {
  event: BatchTransferWebhookEvent;
  reference: string;
  status: 'executed' | 'deferred' | 'failed';
  chunks: BatchTransferChunkResult[];
  totalOperations: number;
  totalChunks: number;
}

/**
 * Body POSTed to `webhookUrl` for a single chunk's settlement, proxied
 * from the underlying signing service. Signed the same way as the
 * lifecycle events above.
 */
export interface BatchTransferSettlementWebhookPayload {
  queueId: string;
  status: 'pending' | 'confirmed' | 'settled' | 'failed';
  message: {
    urn: string;
    railName: string;
    metadata?: Record<string, unknown>;
  };
  settlement: {
    status:
      | 'pending'
      | 'confirmed'
      | 'settled'
      | 'cancelled'
      | 'failed'
      | 'ignored';
    txHash?: string;
    output?: { results: unknown[] };
    [key: string]: unknown;
  };
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
  | 'breb'
  | 'card'
  | `card-${string}`
  | 'external-us-bank'
  | 'virtual'
  | 'polygon'
  | 'us2-account'
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
   * Multiple account URNs to filter by
   */
  urns?: string[];

  /**
   * Account medium/type to filter by
   */
  medium?: AccountMedium;

  /**
   * Free-text search query
   */
  q?: string;

  /**
   * Filter by a custom identifier set on the account
   */
  customId?: string;

  /**
   * Filter by account status (one or more)
   */
  status?: AccountStatus | AccountStatus[];

  /**
   * Only accounts created on or after this ISO 8601 timestamp
   * @example "2026-01-01T00:00:00.000Z"
   */
  createdAfter?: string;

  /**
   * Only accounts created on or before this ISO 8601 timestamp
   * @example "2026-01-31T23:59:59.999Z"
   */
  createdBefore?: string;

  /**
   * Filter by a single ledger account ID
   */
  ledgerAccountId?: string;

  /**
   * Filter by multiple ledger account IDs
   */
  ledgerAccountIds?: string[];

  /**
   * Filter by metadata key/value pairs
   */
  metadata?: Record<string, string>;

  /**
   * Maximum number of accounts to return
   * @default 100
   */
  limit?: number;

  /**
   * Number of accounts to skip
   * @default 0
   */
  offset?: number;

  /**
   * Sort order by creation date
   * @default "DESC"
   */
  order?: 'ASC' | 'DESC';
}

/**
 * Result of listing accounts.
 * Each account is mapped to its medium-specific type
 * (CardAccount, VirtualAccount, PolygonAccount, BancolombiaAccount, BrebKeyAccount, or UsAccount).
 */
export interface ListAccountsResult {
  /** Array of medium-specific mapped accounts */
  accounts: Array<
    | import('./card/types').CardAccount
    | import('./virtual/types').VirtualAccount
    | import('./polygon/types').PolygonAccount
    | import('./bancolombia/types').BancolombiaAccount
    | import('./breb/types').BrebKeyAccount
    | import('./external-us-bank/types').ExternalUsBankAccount
    | import('./us2/types').Us2Account
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

/**
 * Parameters for aggregated balances across accounts.
 */
export interface GetBalancesParams {
  /**
   * Restrict the aggregation to this subset of the holder's accounts.
   * Omit to aggregate across all of them.
   */
  accountUrns?: string[];
}

/**
 * Parameters for listing transactions across all accounts.
 * This endpoint does not receive account URN.
 */
export interface ListTransactionsParams {
  /**
   * Restrict the query to this subset of the holder's accounts. Omit to
   * query across all of them.
   */
  accountUrns?: string[];
  /**
   * Asset to filter transactions by.
   * @example "DUSD/6"
   */
  asset?: SupportedAsset;
  /**
   * Maximum number of transactions to return.
   * @example 50
   */
  limit?: number;
  /**
   * Filter transactions before this date (ISO 8601).
   * @example "2026-01-01T00:00:00Z"
   */
  before?: string;
  /**
   * Filter transactions after this date (ISO 8601).
   * @example "2026-01-01T00:00:00Z"
   */
  after?: string;
  /**
   * Filter by transaction reference.
   */
  reference?: string;
  /**
   * Filter by transaction direction.
   */
  direction?: 'in' | 'out';
  /**
   * When true, returns a collapsed view of transactions.
   */
  collapsed_view?: boolean;
  /**
   * Filter by pocket: 'main' for confirmed transactions, 'pending' for pending transactions.
   */
  pocket?: 'main' | 'pending';
  /**
   * Pagination token for fetching the next page.
   */
  next?: string;
}

/**
 * Transaction returned by the global transactions endpoint.
 */
export interface GlobalTransaction {
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
  /** Transaction reference */
  reference: string;
  /** Rail/network name */
  railName: string;
  /** Transaction details (free-form payload from API) */
  details: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: string;
  /** Transaction type (when provided by API) */
  type?: MovementType;
}

/**
 * Paged result for global transactions.
 */
export interface ListTransactionsResult {
  /** Array of transactions */
  data: GlobalTransaction[];
  /** Number of results in this page */
  pageSize: number;
  /** Whether more results are available */
  hasMore: boolean;
  /** Pagination token for the next page (if hasMore is true) */
  next?: string;
}

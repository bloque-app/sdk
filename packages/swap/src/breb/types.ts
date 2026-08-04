import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

/**
 * Identifies the payout's recipient by their BRE-B key — any valid key on
 * the network, whether or not it corresponds to a Bloque-managed account.
 */
export interface BrebDestinationKey {
  /** The recipient's BRE-B key value, e.g. `'@JAR1234'`. */
  keyValue: string;
  /** The recipient key's type. */
  keyType: 'ID' | 'PHONE' | 'MOBILE' | 'EMAIL' | 'ALPHA' | 'BCODE';
  /** Optional display name for the recipient. */
  displayName?: string;
}

export interface BrebDepositInformation {
  /**
   * Any unique string identifying this payout. With the active provider
   * (Cobre), this is used only to derive an idempotency key — it is *not* a
   * real resolution from `session.accounts.breb.resolveKey()`, which is
   * unsupported for Cobre (fails with `E_COBRE_RESOLVE_KEY_UNSUPPORTED`).
   * There is no need to resolve the recipient key before calling
   * `session.swap.breb.create()` — pass any unique value here, e.g. your
   * own order/idempotency id.
   */
  resolutionId: string;

  /**
   * The recipient of this payout. Required — any valid Bre-B key, whether
   * or not it corresponds to a Bloque-managed account. Independent of
   * `args.sourceAccountUrn`, which only identifies the account being
   * debited on-chain to fund the payout.
   */
  destinationKey: BrebDestinationKey;
}

/**
 * Deposit information for BRE-B on-ramp (COP deposit → Kusama credit).
 */
export interface BrebDepositOnRampInformation {
  /**
   * Destination account URN that will be credited on Kusama.
   */
  urn: string;
}

export interface BrebSwapArgs {
  /**
   * Your own Kusama-linked BRE-B account URN — funds the payout (this
   * account's on-chain balance is debited). Not the recipient; see
   * `depositInformation.destinationKey` for that.
   */
  sourceAccountUrn: string;
}

export interface CreateBrebOrderParams {
  /**
   * Rate signature from findRates.
   */
  rateSig: string;

  /**
   * Optional webhook URL for order status notifications.
   */
  webhookUrl?: string;

  /**
   * Source amount as bigint string (required if type is 'src').
   */
  amountSrc?: string;

  /**
   * Destination amount as bigint string (required if type is 'dst').
   */
  amountDst?: string;

  /**
   * Order type (default: 'src').
   */
  type?: OrderType;

  /**
   * BRE-B payout route information.
   */
  depositInformation: BrebDepositInformation;

  /**
   * Source account for the debit leg.
   */
  args: BrebSwapArgs;

  /**
   * Specific node ID to execute (defaults to first node).
   */
  nodeId?: string;

  /**
   * Additional metadata for the order.
   */
  metadata?: Record<string, unknown>;
}

export interface CreateBrebOrderOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreateBrebOrderResult {
  /**
   * The created order.
   */
  order: SwapOrder;

  /**
   * Execution result if the first node was auto-executed.
   */
  execution?: ExecutionResult;

  /**
   * Request ID for tracking.
   */
  requestId: string;
}

/**
 * Parameters for creating a BRE-B on-ramp deposit order (COP → Kusama).
 */
export interface CreateBrebDepositParams {
  /**
   * Rate signature from findRates.
   */
  rateSig: string;

  /**
   * Optional webhook URL for order status notifications.
   */
  webhookUrl?: string;

  /**
   * Source amount as bigint string (required if type is 'src').
   */
  amountSrc?: string;

  /**
   * Destination amount as bigint string (required if type is 'dst').
   */
  amountDst?: string;

  /**
   * Order type (default: 'src').
   */
  type?: OrderType;

  /**
   * Destination account URN to credit on Kusama.
   */
  depositInformation: BrebDepositOnRampInformation;

  /**
   * When provided, auto-executes the first node and pauses with the BRE-B key.
   * Pass `{}` to trigger auto-execution with server-filled defaults.
   */
  args?: Record<string, unknown>;

  /**
   * Specific node ID to execute (defaults to first node).
   */
  nodeId?: string;

  /**
   * Additional metadata for the order.
   */
  metadata?: Record<string, unknown>;
}

export interface CreateBrebDepositOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreateBrebDepositResult {
  /**
   * The created order.
   */
  order: SwapOrder;

  /**
   * Execution result when args were provided. The paused `how` is
   * `ExecutionHowBrebDeposit` with the one-time BRE-B key to pay.
   */
  execution?: ExecutionResult;

  /**
   * Request ID for tracking.
   */
  requestId: string;
}

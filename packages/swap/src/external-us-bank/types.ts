import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

/** Destination medium for an external US bank ACH on-ramp. */
export type ExternalUsBankDestination = 'kusama' | 'base';

/**
 * Deposit information for external US bank on-ramp to Kusama (ACH pull → DUSD).
 */
export interface ExternalUsBankDepositInformation {
  /**
   * Destination Kusama ledger account id to credit after teleport.
   */
  ledgerAccountId: string;
}

/**
 * Deposit information for external US bank on-ramp to Base (ACH pull → USDC).
 */
export interface ExternalUsBankBaseDepositInformation {
  /**
   * Destination 0x on Base to receive USDC.
   */
  walletAddress: string;
  /**
   * Optional label for the destination wallet. Defaults server-side when omitted.
   */
  walletName?: string;
}

/**
 * Arguments for external US bank on-ramp auto-execution.
 */
export interface ExternalUsBankArgs {
  /**
   * Linked external US bank account URN to pull funds from.
   */
  sourceAccountUrn: string;
}

interface CreateExternalUsBankOrderParamsBase {
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
   * Linked bank account and auto-execution arguments.
   */
  args: ExternalUsBankArgs;

  /**
   * Specific node ID to execute (defaults to first node).
   */
  nodeId?: string;

  /**
   * Additional metadata for the order.
   */
  metadata?: Record<string, unknown>;
}

/**
 * ACH on-ramp to Kusama DUSD. `toMedium` may be omitted — Kusama is the default.
 */
export interface CreateExternalUsBankKusamaOrderParams
  extends CreateExternalUsBankOrderParamsBase {
  toMedium?: 'kusama';
  /**
   * Destination ledger account to credit on Kusama.
   */
  depositInformation: ExternalUsBankDepositInformation;
}

/**
 * ACH on-ramp to USDC on Base.
 */
export interface CreateExternalUsBankBaseOrderParams
  extends CreateExternalUsBankOrderParamsBase {
  toMedium: 'base';
  /**
   * Destination 0x on Base to receive USDC.
   */
  depositInformation: ExternalUsBankBaseDepositInformation;
}

/**
 * Parameters for creating an external US bank on-ramp order.
 *
 * Defaults to Kusama (`toMedium` omitted). Pass `toMedium: 'base'` with
 * `depositInformation.walletAddress` to land USDC on Base.
 */
export type CreateExternalUsBankOrderParams =
  | CreateExternalUsBankKusamaOrderParams
  | CreateExternalUsBankBaseOrderParams;

export interface CreateExternalUsBankOrderOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreateExternalUsBankOrderResult {
  /** The created order */
  order: SwapOrder;
  /** Execution result if auto-execution was triggered */
  execution?: ExecutionResult;
  /** Request ID for tracking */
  requestId: string;
}

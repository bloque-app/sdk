import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

/** Source medium for an RTP payout. */
export type RtpSourceMedium = 'kusama' | 'base';

/**
 * US bank details for RTP payout (Kusama or Base → US bank via RTP).
 */
export interface RtpDepositInformation {
  /** Account holder name */
  owner: string;
  /** Bank account number */
  accountNumber: string;
  /** ABA routing number */
  routingNumber: string;
  /** Account type */
  accountType: 'checking' | 'savings';
  /** Optional bank name */
  bankName?: string;
}

export interface RtpSwapArgs {
  /**
   * Source account URN to debit.
   *
   * Kusama: the Kusama account holding DUSD.
   * Base: the EVM/Polygon account that received USDC on Base.
   */
  sourceAccountUrn: string;
  /**
   * Transaction hash of the incoming USDC transfer on Base.
   * Required when {@link CreateRtpOrderParams.fromMedium} is `'base'`.
   */
  txHash?: string;
}

interface CreateRtpOrderParamsBase {
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
   * Destination US bank account details.
   */
  depositInformation: RtpDepositInformation;

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
 * RTP payout from DUSD on Kusama. `fromMedium` may be omitted — Kusama is the default.
 */
export interface CreateRtpKusamaOrderParams extends CreateRtpOrderParamsBase {
  fromMedium?: 'kusama';
  args: RtpSwapArgs;
}

/**
 * RTP payout from USDC on Base. Requires `args.txHash` of the USDC transfer.
 */
export interface CreateRtpBaseOrderParams extends CreateRtpOrderParamsBase {
  fromMedium: 'base';
  args: RtpSwapArgs & { txHash: string };
}

/**
 * Parameters for creating an RTP payout swap order.
 *
 * Defaults to Kusama (`fromMedium` omitted). Pass `fromMedium: 'base'` with
 * `args.txHash` to cash out USDC already sent to the source EVM account on Base.
 */
export type CreateRtpOrderParams =
  | CreateRtpKusamaOrderParams
  | CreateRtpBaseOrderParams;

export interface CreateRtpOrderOptions {
  /**
   * Optional custom idempotency key sent as `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

export interface CreateRtpOrderResult {
  /** The created order */
  order: SwapOrder;
  /** Execution result if auto-execution was triggered */
  execution?: ExecutionResult;
  /** Request ID for tracking */
  requestId: string;
}

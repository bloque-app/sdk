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
   * Kusama account URN holding DUSD to debit.
   */
  sourceAccountUrn: string;
}

/**
 * Optional Base RTP take args. Omit the object entirely to pause for a
 * USDC deposit (`execution.how` is `WALLET_TRANSFER`). Pass `txHash` only
 * when USDC is already in the inbox and you want to skip the pause.
 */
export interface RtpBaseSwapArgs {
  /**
   * Transaction hash of a native USDC transfer **into the Base RTP inbox**.
   * Omit or leave empty to pause; do not invent a hash.
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
 * RTP payout from USDC on Base. `args` is optional — the live API does not
 * require a source URN or tx hash. The create call still sends empty `args`
 * so the first graph node auto-executes and returns the deposit `how`.
 */
export interface CreateRtpBaseOrderParams extends CreateRtpOrderParamsBase {
  fromMedium: 'base';
  args?: RtpBaseSwapArgs;
}

/**
 * Parameters for creating an RTP payout swap order.
 *
 * Defaults to Kusama (`fromMedium` omitted), which still requires
 * `args.sourceAccountUrn`. Pass `fromMedium: 'base'` with bank
 * `depositInformation` only to cash out USDC on Base; optional `args.txHash`
 * skips the wallet-transfer pause.
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

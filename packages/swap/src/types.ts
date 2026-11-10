/**
 * Public types for @bloque/sdk-swap
 */

/**
 * Fee component type
 */
export type FeeComponentType = 'percentage' | 'rate' | 'fixed';

/**
 * Who a fee component pays: Bloque, the payment provider, or a shared pool.
 * Components without a role are charged by the provider on its side.
 */
export type FeeRole = 'bloque_fee' | 'provider_cost' | 'service_pool';

/**
 * Fee component details
 */
export interface FeeComponent {
  /** Timestamp when this component was calculated */
  at: number;
  /** Component name (e.g., 'take_rate', 'exchange_rate', 'pse_fee') */
  name: string;
  /** Type of fee component */
  type: FeeComponentType;
  /**
   * Value the formula uses for this component, as a decimal or fraction
   * string (e.g. `"1/400"` for 0.25%, `"5"` for 5 units of the source asset).
   */
  value: number | string;
  /** Percentage value (only for percentage type), e.g. `"0.25"` */
  percentage?: number | string;
  /** Currency pair (only for rate type) */
  pair?: string;
  /** Fixed amount in source-asset units (only for fixed type), e.g. `"5"` */
  amount?: number | string;
  /** Who receives this component, when assigned */
  role?: FeeRole;
  /** Expression used to compute this component's share, when set */
  roleExpression?: string;
}

/**
 * Fee details for a rate
 */
export interface Fee {
  /** Timestamp when the fee was calculated */
  at: number;
  /**
   * Formula output for the reference amount in `SwapRate.rate[0]`. Use
   * `calculateRateQuote()` for a specific amount.
   */
  value: number | string;
  /** Formula used to calculate the fee */
  formula: string;
  /** Components that make up the fee */
  components: FeeComponent[];
}

/**
 * Rate limits tuple [min, max]
 */
export type RateLimits = [string, string];

/**
 * Rate tuple [sourceAmount, destinationAmount]
 */
export type RateTuple = [number, number];

/**
 * Exchange rate information
 */
export interface SwapRate {
  /** Unique rate identifier */
  id: string;
  /** Rate signature */
  sig: string;
  /** Swap signature */
  swapSig: string;
  /** Maker identifier */
  maker: string;
  /** Asset edge [fromAsset, toAsset] */
  edge: [string, string];
  /** Fee details */
  fee: Fee;
  /** Timestamp when the rate was created */
  at: string;
  /** Timestamp until the rate is valid */
  until: string;
  /** Available source mediums */
  fromMediums: string[];
  /** Available destination mediums */
  toMediums: string[];
  /** Rate tuple [sourceAmount, destinationAmount] for a reference amount */
  rate: RateTuple;
  /**
   * Exchange ratio at the reference amount in `rate[0]`. Not valid for other
   * amounts when the fee has a fixed component: use `calculateRateQuote()`.
   */
  ratio: number;
  /** Source amount limits [min, max] */
  fromLimits: RateLimits;
  /** Destination amount limits [min, max] */
  toLimits: RateLimits;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Parameters for finding exchange rates
 */
export interface FindRatesParams {
  /**
   * Source asset with precision (e.g., "COP/2" where /2 indicates 2 decimal places)
   * @example "COP/2"
   */
  fromAsset: string;

  /**
   * Destination asset with precision (e.g., "DUSD/6" where /6 indicates 6 decimal places)
   * @example "DUSD/6"
   */
  toAsset: string;

  /**
   * Source payment mediums (e.g., PSE, Bancolombia, Nequi)
   * @example ["bancolombia", "pse"]
   */
  fromMediums: string[];

  /**
   * Destination payment mediums (e.g., Pomelo, Kreivo)
   * @example ["kusama", "pomelo"]
   */
  toMediums: string[];

  /**
   * Source amount as bigint string (scaled by asset precision).
   * Provide this OR amountDst, not both.
   * @example "1000000" represents 10000.00 for COP/2
   */
  amountSrc?: string;

  /**
   * Destination amount as bigint string (scaled by asset precision).
   * Provide this OR amountSrc, not both.
   * @example "50000" represents 0.5000 for USD/4
   */
  amountDst?: string;

  /**
   * Sort order: 'asc' (best rate first) or 'desc' (highest rate first)
   * @default "asc"
   */
  sort?: 'asc' | 'desc';

  /**
   * Sort by field: 'rate' (by exchange ratio) or 'at' (by calculation time)
   * @default "rate"
   */
  sortBy?: 'rate' | 'at';
}

/**
 * Result of finding exchange rates
 */
export interface FindRatesResult {
  /** Array of available rates */
  rates: SwapRate[];
}

/**
 * Order status
 */
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Parameters for listing orders by taker
 */
export interface ListOrdersParams {
  /** Filter by order signature */
  orderSig?: string;
  /** Filter by swap signature */
  swapSig?: string;
  /** Filter by rate signature */
  rateSig?: string;
  /** Filter by maker URN */
  makerUrn?: string;
  /** Filter by order status */
  status?: OrderStatus;
  /** Filter by graph ID */
  graphId?: string;
  /** Filter orders after this timestamp */
  after?: number;
  /** Filter orders before this timestamp */
  before?: number;
}

/**
 * Result of listing orders
 */
export interface ListOrdersResult {
  orders: import('./bank-transfer/types').SwapOrder[];
}

export interface CancelSubscriptionParams {
  /**
   * Order signature (`order_sig`) of the recurring subscription.
   */
  orderId: string;
}

export type CancelSubscriptionStatus =
  | 'cancellation_pending'
  | 'already_cancelled'
  | 'graph_done';

export interface CancelSubscriptionResult {
  status: CancelSubscriptionStatus;
  cursor: number | null;
  orderId: string;
  graphId: string;
}

/**
 * One fee line of a quote, in destination-asset atoms.
 */
export interface RateQuoteFee {
  /** Component name, e.g. `bloque_pct` */
  name: string;
  /** `percentage` or `fixed` */
  type: 'percentage' | 'fixed';
  /** Who receives it, when assigned */
  role?: FeeRole;
  /** Percentage, for `percentage` components (e.g. `"1.75"`) */
  percentage?: string;
  /** Fixed amount in source-asset units, for `fixed` components (e.g. `"5"`) */
  fixedAmount?: string;
  /** What this component costs for the quoted amount, in destination atoms */
  amount: string;
}

/**
 * What a rate delivers for a specific source amount.
 */
export interface RateQuote {
  /** Source asset with precision, e.g. `MXN/2` */
  fromAsset: string;
  /** Destination asset with precision, e.g. `MXNB/2` */
  toAsset: string;
  /** Destination currency code the amounts are in, e.g. `MXNB` */
  currency: string;
  /** Source amount in source atoms */
  amountSrc: string;
  /** Amount received, in destination atoms (rounded down, like the server) */
  amountDst: string;
  /** Amount before fees, in destination atoms */
  amountBeforeFees: string;
  /** Total fee: `amountBeforeFees - amountDst`, in destination atoms */
  fee: string;
  /**
   * Each percentage and fixed component, in destination atoms. Each line is
   * rounded down on its own, so their sum can be an atom below `fee`.
   */
  fees: RateQuoteFee[];
}

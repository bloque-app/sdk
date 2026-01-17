/**
 * Public types for @bloque/sdk-swap
 */

/**
 * Fee component type
 */
export type FeeComponentType = 'percentage' | 'rate' | 'fixed';

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
  /** Component value */
  value: number | string;
  /** Percentage value (only for percentage type) */
  percentage?: number;
  /** Currency pair (only for rate type) */
  pair?: string;
  /** Fixed amount (only for fixed type) */
  amount?: number;
}

/**
 * Fee details for a rate
 */
export interface Fee {
  /** Timestamp when the fee was calculated */
  at: number;
  /** Fee value */
  value: number;
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
  /** Rate tuple [sourceAmount, destinationAmount] */
  rate: RateTuple;
  /** Exchange ratio */
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

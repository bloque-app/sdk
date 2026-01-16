/**
 * @internal
 * Wire types for API communication (snake_case format)
 * These types represent the raw API request/response format
 * and should not be used directly by SDK consumers.
 */

/**
 * @internal
 * Fee component type from API
 */
export type FeeComponentType = 'percentage' | 'rate' | 'fixed';

/**
 * @internal
 * Fee component from API
 */
export interface FeeComponent {
  at: number;
  name: string;
  type: FeeComponentType;
  value: number | string;
  percentage?: number;
  pair?: string;
  amount?: number;
}

/**
 * @internal
 * Fee details from API
 */
export interface Fee {
  at: number;
  value: number;
  formula: string;
  components: FeeComponent[];
}

/**
 * @internal
 * Rate from API
 */
export interface Rate {
  id: string;
  sig: string;
  swap_sig: string;
  maker: string;
  edge: [string, string];
  fee: Fee;
  at: string;
  until: string;
  from_medium: string[];
  to_medium: string[];
  rate: [number, number];
  ratio: number;
  from_limits: [string, string];
  to_limits: [string, string];
  created_at: string;
  updated_at: string;
}

/**
 * @internal
 * Find rates response from API
 */
export interface FindRatesResponse {
  rates: Rate[];
}

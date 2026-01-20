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

export interface PseBank {
  financial_institution_code: string;
  financial_institution_name: string;
}

export interface ListPseBanksResponse {
  banks: PseBank[];
}

// Order types for PUT /api/order

/**
 * @internal
 * Order type for swap (source or destination amount specified)
 */
export type OrderType = 'src' | 'dst';

/**
 * @internal
 * Deposit information for cash-in (fiat to crypto)
 */
export interface DepositInformationCashIn {
  ledger_account_id?: string;
}

/**
 * @internal
 * Deposit information for cash-out (crypto to fiat)
 */
export interface DepositInformationCashOut {
  bank_code?: string;
  account_number?: string;
  account_type?: string;
}

/**
 * @internal
 * Deposit information union type
 */
export type DepositInformation =
  | DepositInformationCashIn
  | DepositInformationCashOut
  | Record<string, unknown>;

/**
 * @internal
 * Create order input for PUT /api/order
 */
export interface CreateOrderInput {
  taker_urn: string;
  type: OrderType;
  rate_sig: string;
  from_medium: string;
  to_medium: string;
  amount_src?: string;
  amount_dst?: string;
  deposit_information: DepositInformation;
  args?: Record<string, unknown>;
  node_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * @internal
 * Order from API response
 */
export interface OrderResponse {
  id: string;
  order_sig: string;
  rate_sig: string;
  swap_sig: string;
  taker: string;
  maker: string;
  from_asset: string;
  to_asset: string;
  from_medium: string;
  to_medium: string;
  from_amount: string;
  to_amount: string;
  deposit_information: DepositInformation;
  at: number;
  graph_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * @internal
 * Execution result from auto-execution
 */
export interface ExecutionResult {
  node_id: string;
  result: {
    status: string;
    args?: unknown[];
    description?: string;
    checkout_url?: string;
  };
}

/**
 * @internal
 * Create order response from PUT /api/order
 */
export interface CreateOrderResponse {
  result: {
    order: OrderResponse;
    execution?: ExecutionResult;
  };
  req_id: string;
}

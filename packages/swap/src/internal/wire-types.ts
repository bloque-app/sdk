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
 * Deposit information for swap orders
 */
export interface DepositInformation {
  /** PSE deposit URN */
  urn?: string;
  /** Bancolombia deposit information */
  bancolombia?: BancolombiaDepositInformation;
}

/**
 * @internal
 * Bancolombia deposit information for bank account details
 */
export interface BancolombiaDepositInformation {
  bank_account_type: 'savings' | 'checking';
  bank_account_number: string;
  bank_account_holder_name: string;
  bank_account_holder_identification_type: 'CC' | 'CE' | 'NIT' | 'PP';
  bank_account_holder_identification_value: string;
}

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
  webhook_url?: string;
  amount_src?: string;
  amount_dst?: string;
  deposit_information: DepositInformation | BancolombiaDepositInformation;
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
  at: string;
  graph_id: string;
  status: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * @internal
 * Execution redirect instructions
 */
export interface ExecutionHow {
  type: string;
  url: string;
}

/**
 * @internal
 * Execution result from auto-execution
 */
export interface ExecutionResult {
  node_id: string;
  result: {
    status: string;
    name?: string;
    description?: string;
    how?: ExecutionHow;
    callback_token?: string;
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

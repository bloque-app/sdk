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
  /** PSE / BRE-B on-ramp deposit URN */
  urn?: string;
  /** BRE-B payout resolution id */
  resolution_id?: string;
  /** External US bank on-ramp: destination Kusama ledger account id */
  ledger_account_id?: string;
  /** RTP payout: account holder name */
  owner?: string;
  /** RTP payout: bank account number */
  account_number?: string;
  /** RTP payout: ABA routing number */
  routing_number?: string;
  /** RTP payout: account type */
  account_type?: 'checking' | 'savings';
  /** RTP payout: optional bank name */
  bank_name?: string;
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
  webhook_url?: string;
  failure_reason?: string;
  failure_details?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * @internal
 * List orders by taker response
 */
export interface ListOrdersResponse {
  orders: OrderResponse[];
}

/**
 * @internal
 * Execution redirect instructions (PSE, card, etc.)
 */
export interface ExecutionHowRedirect {
  type: string;
  url?: string;
}

/**
 * @internal
 * BRE-B on-ramp deposit instructions returned when the graph pauses
 */
export interface ExecutionHowBrebDeposit {
  type: 'BREB_DEPOSIT';
  medium: 'breb';
  key_type: string;
  key_value: string;
  amount: string;
  currency: 'COP';
  reference: string;
  deposit_account_urn: string;
}

/**
 * @internal
 * Discriminated union of execution instructions
 */
export type ExecutionHow = ExecutionHowRedirect | ExecutionHowBrebDeposit;

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

/**
 * @internal
 * Cancel subscription response from API.
 */
export interface CancelSubscriptionResponse {
  result: {
    status: 'cancellation_pending' | 'already_cancelled' | 'graph_done';
    cursor: number | null;
    order_id: string;
    graph_id: string;
  };
  req_id: string;
}

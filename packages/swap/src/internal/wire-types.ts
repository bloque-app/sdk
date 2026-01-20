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

type Currency = 'DUSD/6' | 'COP/2' | 'KSM/12';

// Payment types

/**
 * @internal
 * Payment item in request (snake_case)
 */
export interface CreatePaymentItemInput {
  name: string;
  amount: string;
  sku?: string;
  description?: string;
  quantity: number;
  image_url?: string;
}

/**
 * @internal
 * Create payment request body
 */
export interface CreatePaymentInput {
  name: string;
  description?: string;
  currency: Currency;
  payment_type: string;
  image_url?: string;
  items: CreatePaymentItemInput[];
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
  webhook_url?: string;
}

/**
 * @internal
 * Payment item in response
 */
export interface PaymentItemResponse {
  name: string;
  amount: number;
  sku?: string;
  description?: string;
  quantity: number;
  image_url?: string;
}

/**
 * @internal
 * Payment summary from API
 */
export interface PaymentSummaryResponse {
  status: string;
}

/**
 * @internal
 * Payment response from API
 */
export interface PaymentResponse {
  urn: string;
  owner_urn: string;
  name: string;
  description?: string;
  currency: Currency;
  amount: number;
  url: string;
  success_url?: string;
  cancel_url?: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
  tax?: number;
  discount_code?: string;
  webhook_url?: string;
  payout_route: unknown[];
  summary: PaymentSummaryResponse;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  payment_type: string;
  items: PaymentItemResponse[];
}

/**
 * @internal
 * Create payment API response wrapper
 */
export interface CreatePaymentResponse {
  payment: PaymentResponse;
}

/**
 * @internal
 * Payee info for PSE payment
 */
export interface PsePayeeInput {
  name: string;
  email: string;
  id_type: string;
  id_number: string;
}

/**
 * @internal
 * Initiate PSE payment request body
 */
export interface InitiatePsePaymentInput {
  payment_urn: string;
  payee: PsePayeeInput;
  person_type: string;
  bank_code: string;
}

/**
 * @internal
 * Initiate PSE payment response
 */
export interface InitiatePsePaymentResponse {
  payment_id: string;
  status: string;
  message: string;
  amount: string;
  currency: Currency;
  checkout_url: string;
  order_id: string;
  order_status: string;
  created_at: string;
}

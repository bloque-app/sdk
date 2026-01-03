/**
 * @internal
 * Wire types for API communication (snake_case format)
 * These types represent the raw API request/response format
 * and should not be used directly by SDK consumers.
 */

/**
 * @internal
 * Account status from API
 */
export type AccountStatus =
  | 'active'
  | 'disabled'
  | 'frozen'
  | 'deleted'
  | 'creation_in_progress'
  | 'creation_failed';

/**
 * @internal
 * Raw account from API
 */
export interface Account<TDetails = unknown> {
  id: string;
  urn: string;
  medium: 'bancolombia' | 'card';
  details: TDetails;
  ledger_account_id: string;
  status: AccountStatus;
  owner_urn: string;
  created_at: string;
  updated_at: string;
  webhook_url: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * @internal
 * Card type enum
 */
export type CardType = 'VIRTUAL' | 'PHYSICAL';

/**
 * @internal
 * Create account request body
 */
export interface CreateAccountRequest<TInput = unknown> {
  holder_urn: string;
  ledger_account_id?: string;
  input: TInput;
  metadata?: Record<string, unknown>;
  webhook_url?: string;
}

/**
 * @internal
 * Card account input for creation
 */
export type CreateCardAccountInput = {
  create: {
    card_type: CardType;
  };
};

/**
 * @internal
 * Create account response
 */
export interface CreateAccountResponse<TDetails = unknown> {
  result: {
    account: Account<TDetails>;
  };
  req_id: string;
}

/**
 * @internal
 * Card details from API
 */
export type CardDetails = {
  id: string;
  email: string;
  operational_country: 'COL';
  client_id: string;
  card_id: string;
  card_last_four: string;
  card_provider: 'VISA';
  card_product_type: 'CREDIT';
  card_status: 'ACTIVE';
  card_url_details: string;
  card_type: CardType;
  user_id: string;
};

/**
 * @internal
 * Bancolombia details from API
 */
export type BancolombiaDetails = {
  id: string;
  reference_code: string;
  payment_agreement_code: string;
  network: string[];
};

/**
 * @internal
 * Update account request body
 */
export interface UpdateAccountRequest<TInput = unknown> {
  input?: TInput;
  metadata?: Record<string, unknown>;
  status?: AccountStatus;
}

/**
 * @internal
 * Update account response
 */
export interface UpdateAccountResponse<TDetails = unknown> {
  result: {
    account: Account<TDetails>;
  };
  req_id: string;
}

/**
 * @internal
 * Token balance from API
 */
export interface TokenBalance {
  current: string;
  pending: string;
  in: string;
  out: string;
}

/**
 * @internal
 * Account with balance from API
 */
export interface AccountWithBalance<TDetails = unknown>
  extends Account<TDetails> {
  balance: Record<string, TokenBalance>;
}

/**
 * @internal
 * List accounts response
 */
export interface ListAccountsResponse<TDetails = unknown> {
  accounts: AccountWithBalance<TDetails>[];
}

/**
 * @internal
 * Transaction metadata from API
 */
export interface TransactionMetadata {
  amount?: string;
  asset_type?: string;
  card_id?: string;
  card_last_four?: string;
  card_product_type?: string;
  card_provider?: string;
  currency?: string;
  installments?: string;
  local_amount?: string;
  local_currency?: string;
  local_to_usd_rate?: string;
  merchant_address?: string;
  merchant_city?: string;
  merchant_country?: string;
  merchant_id?: string;
  merchant_mcc?: string;
  merchant_name?: string;
  merchant_terminal_id?: string;
  operation_type?: string;
  original_transaction_id?: string;
  selected_asset?: string;
  transaction_id?: string;
  transaction_type?: string;
  type?: string;
  usd_amount?: string;
  user_id?: string;
  [key: string]: unknown;
}

/**
 * @internal
 * Transaction details from API
 */
export interface TransactionDetails {
  metadata: TransactionMetadata;
  type: string;
}

/**
 * @internal
 * Transaction from API
 */
export interface Transaction {
  amount: string;
  asset: string;
  from_account_id: string;
  to_account_id: string;
  direction: 'in' | 'out';
  reference: string;
  rail_name: string;
  details: TransactionDetails;
  created_at: string;
}

/**
 * @internal
 * List movements response
 */
export interface ListMovementsResponse {
  transactions: Transaction[];
}

/**
 * @internal
 * Get balance response
 */
export interface GetBalanceResponse {
  balance: Record<string, TokenBalance>;
}

/**
 * @internal
 * Transfer request body
 */
export interface TransferRequest {
  destination_account_urn: string;
  amount: string;
  asset: string;
  metadata?: Record<string, unknown>;
}

/**
 * @internal
 * Transfer response from API
 */
export interface TransferResponse {
  result: {
    queue_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    message: string;
  };
  req_id: string;
}

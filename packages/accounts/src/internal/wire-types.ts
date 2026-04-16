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
  medium:
    | 'bancolombia'
    | 'breb'
    | 'card'
    | 'virtual'
    | 'us-account'
    | 'us2-account'
    | 'polygon';
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
 * BRE-B account details from API.
 */
export type BrebDetails = {
  id: string;
  remote_key_id: string;
  account_id: string;
  key: {
    key_type: 'ID' | 'PHONE' | 'EMAIL' | 'ALPHA' | 'BCODE';
    key_value: string;
  };
  display_name: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  raw_response: Record<string, unknown>;
};

/**
 * @internal
 * Virtual account input for creation
 */
export type CreateVirtualAccountInput = {};

/**
 * @internal
 * Virtual account details from API
 */
export type VirtualDetails = {
  id: string;
  first_name: string;
  last_name: string;
};

/**
 * @internal
 * Polygon account input for creation
 */
export type CreatePolygonAccountInput = Record<string, never>;

/**
 * @internal
 * Polygon account details from API
 */
export type PolygonDetails = {
  id: string;
  address: string;
  network: string;
};

/**
 * @internal
 * US account type
 */
export type UsAccountType = 'individual' | 'business';

/**
 * @internal
 * US account address for creation
 */
export interface UsAccountAddress {
  street_line_1: string;
  street_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * @internal
 * US account input for creation
 */
export interface CreateUsAccountInput {
  type: UsAccountType;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  address: UsAccountAddress;
  birth_date: string;
  tax_identification_number: string;
  gov_id_country: string;
  gov_id_image_front: string;
  signed_agreement_id: string;
}

/**
 * @internal
 * US account details from API
 */
export interface UsDetails {
  id: string;
  type: UsAccountType;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  address: UsAccountAddress;
  birth_date: string;
  account_number?: string;
  routing_number?: string;
}

/**
 * @internal
 * US2 account applicant type used during creation.
 */
export type Us2AccountApplicantType = 'individual' | 'business';

/**
 * @internal
 * US2 account address for creation.
 */
export interface Us2AccountAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * @internal
 * Proof-of-address document payload accepted by the backend.
 * The backend contract is provider-shaped and not fully stabilized yet.
 */
export type Us2ProofOfAddress = Record<string, unknown>;

/**
 * @internal
 * US2 account input for creation.
 */
export interface CreateUs2AccountInput {
  type: Us2AccountApplicantType;
  email: string;
  phone?: string;
  tax_id?: string;
  address?: Us2AccountAddress;
  proof_of_address: Us2ProofOfAddress;
}

/**
 * @internal
 * Source deposit instructions returned for an activated US2 account.
 */
export interface Us2SourceDepositInstructions {
  currency?: string;
  bank_name?: string;
  bank_address?: string;
  bank_routing_number?: string;
  bank_account_number?: string;
  bank_beneficiary_name?: string;
  bank_beneficiary_address?: string;
  clabe?: string;
}

/**
 * @internal
 * US2 account details from API.
 */
export interface Us2Details {
  id: string;
  user_id: string;
  virtual_account_id?: string;
  type: string;
  currency: string;
  source_deposit_instructions?: Us2SourceDepositInstructions;
}

/**
 * @internal
 * TOS link response
 */
export interface TosLinkResponse {
  result: {
    url: string;
  };
  req_id: string;
}

/**
 * @internal
 * Update account request body
 */
export interface UpdateAccountRequest<TInput = unknown> {
  input?: TInput;
  metadata?: Record<string, unknown>;
  status?: AccountStatus;
  webhook_url?: string;
  ledger_account_id?: string;
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
 * Get account by URN response
 */
export interface GetAccountResponse<TDetails = unknown> {
  account: AccountWithBalance<TDetails>;
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

export enum TransactionStatus {
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  CONFIRMED = 'confirmed',
  SETTLED = 'settled',
  FAILED = 'failed',
  IGNORED = 'ignored',
}

/**
 * @internal
 * Transaction type from API
 */
export type TransactionType = 'deposit' | 'withdraw' | 'transfer';

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
  type: TransactionType;
  reference: string;
  rail_name: string;
  status: TransactionStatus;
  details: TransactionDetails;
  created_at: string;
}

/**
 * @internal
 * List movements response (paged)
 */
export interface ListMovementsResponse {
  data: Transaction[];
  page_size: number;
  has_more: boolean;
  next?: string;
}

/**
 * @internal
 * Global transaction from API (across all accounts)
 */
export interface GlobalTransaction {
  amount: string;
  asset: string;
  from_account_id: string;
  to_account_id: string;
  direction: 'in' | 'out';
  reference: string;
  rail_name: string;
  status: TransactionStatus;
  type?: TransactionType;
  details?: Record<string, unknown>;
  created_at: string;
}

/**
 * @internal
 * List global transactions response (paged)
 */
export interface ListTransactionsResponse {
  data: GlobalTransaction[];
  page_size: number;
  has_more: boolean;
  next?: string;
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
 * Get aggregated/general balances response
 */
export interface GetBalancesResponse {
  balance: Record<
    string,
    {
      current: string;
      pending: string;
      in?: string;
      out?: string;
    }
  >;
}

/**
 * @internal
 * Apple Pay tokenization request body
 */
export interface TokenizeAppleCardRequest {
  certificates: string[];
  nonce: string;
  nonce_signature: string;
}

/**
 * @internal
 * Apple Pay tokenization response
 */
export interface TokenizeAppleCardResponse {
  result: {
    tokenization: {
      activation_data: string;
      encrypted_pass_data: string;
      ephemeral_public_key: string;
    };
  };
  req_id: string;
}

/**
 * @internal
 * Google Pay tokenization request body
 */
export interface TokenizeGoogleCardRequest {
  device_id: string;
  wallet_account_id: string;
}

/**
 * @internal
 * Google Pay tokenization response
 */
export interface TokenizeGoogleCardResponse {
  result: {
    tokenization: {
      opc: string;
    };
  };
  req_id: string;
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

/**
 * @internal
 * Batch transfer operation request
 */
export interface BatchTransferOperation {
  from_account_urn: string;
  to_account_urn: string;
  reference: string;
  amount: string;
  asset: string;
  metadata?: Record<string, unknown>;
}

/**
 * @internal
 * Batch transfer request body
 */
export interface BatchTransferRequest {
  operations: BatchTransferOperation[];
  reference: string;
  metadata?: Record<string, unknown>;
  webhook_url?: string;
}

/**
 * @internal
 * Batch transfer chunk result
 */
export interface BatchTransferChunk {
  queue_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
}

/**
 * @internal
 * Batch transfer response from API
 */
export interface BatchTransferResponse {
  result: {
    chunks: BatchTransferChunk[];
    total_operations: number;
    total_chunks: number;
  };
  req_id: string;
}

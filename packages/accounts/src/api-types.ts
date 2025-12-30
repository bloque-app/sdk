export type AccountStatus =
  | 'active'
  | 'disabled'
  | 'frozen'
  | 'deleted'
  | 'creation_in_progress'
  | 'creation_failed';

interface Account<TDetails = unknown> {
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

export type CardType = 'VIRTUAL' | 'PHYSICAL';

export interface CreateAccountRequest<TInput = unknown> {
  holder_urn: string;
  ledger_account_id?: string;
  input: TInput;
  metadata?: Record<string, unknown>;
  webhook_url?: string;
}

export type CreateCardAccountInput = {
  create: {
    card_type: CardType;
  };
};

export interface CreateAccountResponse<TDetails = unknown> {
  result: {
    account: Account<TDetails>;
  };
  req_id: string;
}

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

export type BancolombiaDetails = {
  id: string;
  reference_code: string;
  payment_agreement_code: string;
  network: string[];
};

export interface UpdateAccountRequest<TInput = unknown> {
  input?: TInput;
  metadata?: Record<string, unknown>;
  status?: AccountStatus;
}

export interface UpdateAccountResponse<TDetails = unknown> {
  result: {
    account: Account<TDetails>;
  };
  req_id: string;
}

export interface TokenBalance {
  current: string;
  pending: string;
  in: string;
  out: string;
}

export interface AccountWithBalance<TDetails = unknown>
  extends Account<TDetails> {
  balance: Record<string, TokenBalance>;
}

export interface ListAccountsResponse<TDetails = unknown> {
  accounts: AccountWithBalance<TDetails>[];
}

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

export interface TransactionDetails {
  metadata: TransactionMetadata;
  type: string;
}

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

export interface ListMovementsResponse {
  transactions: Transaction[];
}

export interface GetBalanceResponse {
  balance: Record<string, TokenBalance>;
}

export type SupportedAsset = 'DUSD/6' | 'KSM/12';

export interface TransferParams {
  /**
   * URN of the source account
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  sourceUrn: string;
  /**
   * URN of the destination account
   * @example "did:bloque:account:virtual:acc-67890"
   */
  destinationUrn: string;
  /**
   * Amount to transfer
   * @example "1000000000000"
   */
  amount: string;
  /**
   * Asset to transfer
   * @example "USD"
   */
  asset: SupportedAsset;
  /**
   * Optional metadata for the transfer
   * @example { reference: "payment-123", note: "Monthly subscription" }
   */
  metadata?: Record<string, unknown>;
}

export interface TransferRequest {
  destination_account_urn: string;
  amount: string;
  asset: string;
  metadata?: Record<string, unknown>;
}

export interface TransferResult {
  queueId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
}

export interface TransferResponse {
  result: {
    queue_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    message: string;
  };
  req_id: string;
}

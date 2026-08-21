import type {
  CardType,
  TokenBalance,
  Transaction,
} from '../internal/wire-types';
import type { SupportedAsset } from '../types';

/**
 * Parameters for listing card accounts
 */
export interface ListCardAccountsParams {
  /**
   * URN of the account holder (user or organization) to filter by
   * @example "did:bloque:bloque-root:nestor"
   */
  holderUrn?: string;

  /**
   * URN of a specific card account to retrieve
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  urn?: string;

  /**
   * Card medium/program name to filter by.
   * @default "card"
   * @example "card-ktg"
   */
  program?: string;
}

/**
 * Result of listing card accounts
 */
export interface ListCardAccountsResult {
  /** Array of card accounts with balance information */
  accounts: CardAccount[];
}

export interface ListMovementsParams {
  /**
   * URN of the card account
   *
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  urn: string;
  /**
   * Asset to filter transactions by
   *
   * @example "USD" (defaults to "USD" if "USD" is provided)
   */
  asset?: SupportedAsset;
  /**
   * Maximum number of transactions to return
   *
   * @example 50
   */
  limit?: number;
  /**
   * Filter transactions before this date (ISO 8601)
   *
   * @example "2025-01-01T00:00:00Z"
   */
  before?: string;
  /**
   * Filter transactions after this date (ISO 8601)
   *
   * @example "2025-01-01T00:00:00Z"
   */
  after?: string;
  /**
   * Filter by transaction reference
   *
   * @example "0xbff43fa587e0efa275f8b643d95881713c0f0ee13682d049cc452f607241b752"
   */
  reference?: string;
  /**
   * Filter by transaction direction
   * - 'in' for incoming funds (deposits, transfers received)
   * - 'out' for outgoing funds (withdrawals, transfers sent)
   */
  direction?: 'in' | 'out';

  /**
   * When true, returns a collapsed view of movements (e.g. grouped or summarized).
   * See API docs: GET /api/accounts/{urn}/movements
   */
  collapsed_view?: boolean;

  /**
   * Filter by pocket: 'main' for confirmed movements, 'pending' for pending movements
   */
  pocket?: 'main' | 'pending';

  /**
   * Pagination token for fetching the next page (from previous response's next)
   */
  next?: string;
}

/**
 * Paged result for list movements (wire/snake_case from API)
 */
export interface ListMovementsPagedResult {
  /** Array of movements */
  data: CardMovement[];
  /** Number of results in this page */
  pageSize: number;
  /** Whether more results are available */
  hasMore: boolean;
  /** Pagination token for the next page (if hasMore is true) */
  next?: string;
}

export interface CardMovement extends Transaction {
  // Extends Transaction from wire-types (includes type, status, etc.)
}

export interface GetBalanceParams {
  /**
   * URN of the card account
   *
   * @example "did:bloque:account:card:usr-123:crd-456"
   */
  urn: string;
}

// ---------------------------------------------------------------------------
// Card spending-control / cashback / fee metadata — stored under specific
// `metadata` keys (`spending_control`, `cashback_programs`, `spending_fees`,
// ...). These typed fields are the canonical way to set them; like
// `defaultAsset`, they take precedence over the same key passed via a raw
// `metadata` object.
// ---------------------------------------------------------------------------

/** `'default'` routes every purchase to one pocket. `'smart'` routes by MCC across multiple pockets. */
export type SpendingControlMode = 'default' | 'smart';

/** A URL (fetched and cached ~10 min) or an inline array of MCC codes. */
export type MccWhitelistSource = string | string[];

/** Maps a pocket URN to the MCC codes it accepts. Smart spending control only. */
export type MccWhitelist = Record<string, MccWhitelistSource>;

/** Maps an ISO 4217 currency code to preferred settlement assets, in priority order. */
export type CurrencyAssetMap = Record<string, SupportedAsset[]>;

export type CashbackProgramType = 'extra_savings' | 'round_up';
export type CashbackFeeType = 'percentage' | 'flat';

/**
 * An automatic savings program that creates surcharge movements on card
 * transactions. `extra_savings` charges an extra percentage/flat amount per
 * transaction; `round_up` rounds the transaction up, routing the delta to
 * `targetPocketUrn`. Reported via the `cashback_surcharge` webhook event.
 */
export interface CashbackProgram {
  programName: string;
  type: CashbackProgramType;
  targetPocketUrn: string;
  /** Required for `'extra_savings'`; ignored for `'round_up'`. */
  feeType?: CashbackFeeType;
  /** Percentage rate (e.g. `0.05` = 5%) or flat local-currency amount. */
  value?: number;
}

export type SpendingFeeType = 'percentage' | 'flat';
export type SpendingFeeCategory = 'fx' | 'interchange' | 'custom';

/**
 * A fee applied to card transactions. Merged by `feeName` across three
 * layers: defaults → origin metadata → card metadata. Base fees cannot be
 * removed, only overridden.
 */
export interface SpendingFee {
  /** Unique name for the fee, e.g. `"bloque-treasury"`, `"fx_fee"`. */
  feeName: string;
  /** Destination account URN for the fee. */
  accountUrn: string;
  type: SpendingFeeType;
  /** Rate for `'percentage'` (`0.0144` = 1.44%) or a flat scaled amount. */
  value: number;
  /** Purpose of the fee — `'fx'` drives the exchange-rate spread. Defaults to `'custom'`. */
  category?: SpendingFeeCategory;
  /** Gates when this fee applies, e.g. `'fx_conversion'`, `'amount_range_usd'`, `'wallet'`. Always applies if omitted. */
  rule?: string;
  ruleParams?: Record<string, unknown>;
}

export interface CardSpendingControlMetadata {
  /** `'default'` (one pocket, all merchants) or `'smart'` (MCC-based multi-pocket routing). */
  spendingControl?: SpendingControlMode;
  /** Pocket URNs in priority order. Smart spending control only. */
  priorityMcc?: string[];
  /** Pocket URN → accepted MCC codes. Smart spending control only. */
  mccWhitelist?: MccWhitelist;
  /** Automatic savings programs — interchange share, extra savings, or round-up. */
  cashbackPrograms?: CashbackProgram[];
  /** Fee overrides, merged by `feeName` on top of the defaults. */
  spendingFees?: SpendingFee[];
  /** Asset to fall back to when `defaultAsset`/currency matching can't resolve one. */
  fallbackAsset?: SupportedAsset;
  /** Whether to send a WhatsApp notification on purchase. Defaults to enabled. */
  whatsappNotification?: boolean;
  /** ISO 4217 currency code → preferred settlement assets, for direct-match resolution. */
  currencyAssetMap?: CurrencyAssetMap;
}

/**
 * Mailing address for a physical card. All fields required by the provider.
 */
export interface CardMailingAddress {
  streetName: string;
  streetNumber: string;
  floor: string;
  apartment: string;
  city: string;
  region: string;
  country: string;
  zipCode: string;
  neighborhood: string;
}

export interface CreateCardParams {
  /**
   * URN of the account holder (user or organization)
   *
   * @example "did:bloque:user:123e4567"
   */
  holderUrn?: string;
  /**
   * Display name for the card
   */
  name?: string;
  /**
   * Card type to create.
   * @default "VIRTUAL"
   */
  cardType?: CardType;
  /**
   * Mailing address for the physical card. Required when `cardType` is
   * `"PHYSICAL"`.
   */
  cardAddress?: CardMailingAddress;
  /**
   * Webhook URL to receive card events
   */
  webhookUrl?: string;
  /**
   * Ledger account ID to associate with the card
   */
  ledgerId?: string;
  /**
   * Card medium/program name to create the account on.
   * @default "card"
   * @example "card-ktg"
   */
  program?: string;
  /**
   * Primary asset the card settles transactions against (e.g. `"DUSD/6"`).
   * Stored as `metadata.default_asset` — see the Default Spending Control
   * docs. Takes precedence over a `default_asset` key passed via `metadata`.
   * @example "DUSD/6"
   */
  defaultAsset?: SupportedAsset;
  /**
   * Spending-control, cashback, and fee configuration. Each field is
   * stored under its own `metadata` key and takes precedence over the
   * same key passed via a raw `metadata` object.
   */
  spendingControlMetadata?: CardSpendingControlMetadata;
  /**
   * Custom metadata to associate with the card
   */
  metadata?: Record<string, unknown>;
}

/** Reason accompanying a card status change or PIN update. */
export type CardStatusReason =
  | 'CLIENT_INTERNAL_REASON'
  | 'USER_INTERNAL_REASON'
  | 'POMELO_INTERNAL_REASON'
  | 'PROVIDER_INTERNAL_REASON'
  | 'LOST'
  | 'STOLEN'
  | 'BROKEN'
  | 'UPGRADE';

export interface UpdateCardParams {
  /** URN of the card account to update */
  urn: string;
  /** Metadata to update */
  metadata?: Record<string, unknown>;
  /** Account status */
  status?: string;
  /** Reason for the status change, e.g. `'LOST'` or `'STOLEN'` when freezing/disabling. */
  statusReason?: CardStatusReason;
  /** Set or change the card's PIN. */
  pin?: string;
  /** Webhook URL for card events */
  webhookUrl?: string;
  /** Ledger account ID to link */
  ledgerId?: string;
}

export interface UpdateCardMetadataParams {
  /**
   * URN of the card account to update
   *
   * @example "did:bloque:mediums:card:account:123e4567"
   */
  urn: string;
  /**
   * Primary asset the card settles transactions against (e.g. `"DUSD/6"`).
   * Stored as `metadata.default_asset`. Takes precedence over a
   * `default_asset` key passed via `metadata`.
   * @example "DUSD/6"
   */
  defaultAsset?: SupportedAsset;
  /**
   * Spending-control, cashback, and fee configuration. Each field is
   * stored under its own `metadata` key and takes precedence over the
   * same key passed via a raw `metadata` object.
   */
  spendingControlMetadata?: CardSpendingControlMetadata;
  /**
   * Metadata to update (name and source are reserved fields and cannot be modified).
   * Optional when `defaultAsset`/`spendingControlMetadata` is provided on its own.
   */
  metadata?: Record<string, unknown> & {
    name?: never;
    source?: never;
  };
}

/**
 * Parameters for Apple Pay tokenization
 */
export interface TokenizeAppleParams {
  /** Apple Pay certificates */
  certificates: string[];
  /** Cryptographic nonce */
  nonce: string;
  /** Signature of the nonce */
  nonceSignature: string;
}

/**
 * Result of Apple Pay tokenization
 */
export interface TokenizeAppleResult {
  activationData: string;
  encryptedPassData: string;
  ephemeralPublicKey: string;
}

/**
 * Parameters for Google Pay tokenization
 */
export interface TokenizeGoogleParams {
  /** Device ID for Google Pay */
  deviceId: string;
  /** Google wallet account ID */
  walletAccountId: string;
}

/**
 * Result of Google Pay tokenization
 */
export interface TokenizeGoogleResult {
  /** One-time passcode */
  opc: string;
}

export interface CardAccount {
  /**
   * Unique resource name for the card account
   */
  urn: string;
  /**
   * Card account ID
   */
  id: string;
  /**
   * Card medium/program name this account belongs to.
   * @example "card" | "card-ktg"
   */
  program: string;
  /**
   * Last four digits of the card
   */
  lastFour: string;
  /**
   * Type of card product (CREDIT, DEBIT)
   */
  productType: 'CREDIT' | 'DEBIT';
  /**
   * Current status of the card
   */
  status:
    | 'active'
    | 'disabled'
    | 'frozen'
    | 'deleted'
    | 'creation_in_progress'
    | 'creation_failed';
  /**
   * Type of card (VIRTUAL, PHYSICAL)
   */
  cardType: CardType;
  /**
   * Reason for the current status, if one was supplied on the last status
   * update (e.g. `'LOST'`, `'STOLEN'`).
   */
  statusReason?: CardStatusReason;
  /**
   * URL to view card details (PCI-compliant). `null` when the card is
   * blocked.
   */
  detailsUrl: string | null;

  /**
   * Owner URN
   */
  ownerUrn: string;
  /**
   * Ledger account ID associated with the card
   */
  ledgerId: string;
  /**
   * Webhook URL (if configured)
   */
  webhookUrl: string | null;
  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
  /**
   * Primary asset the card settles transactions against, read back from
   * `metadata.default_asset` for convenience.
   * @example "DUSD/6"
   */
  defaultAsset?: SupportedAsset;
  /**
   * Spending-control, cashback, and fee configuration, read back from
   * `metadata` for convenience. `undefined` when none of those keys are set.
   */
  spendingControlMetadata?: CardSpendingControlMetadata;
  /**
   * Creation timestamp
   */
  createdAt: string;
  /**
   * Last update timestamp
   */
  updatedAt: string;
  /**
   * Token balances (only included in list responses)
   */
  balance?: Record<string, TokenBalance>;
}

// ---------------------------------------------------------------------------
// Card webhook payload — POSTed to `webhookUrl`/`account.webhook_url` on
// every authorization/adjustment. Not returned by any client method; these
// types are for consumers who verify/parse the webhook body themselves.
// ---------------------------------------------------------------------------

/** Underlying card-network transaction type. */
export type CardTransactionType =
  | 'PURCHASE'
  | 'WITHDRAWAL'
  | 'EXTRACASH'
  | 'BALANCE_INQUIRY'
  | 'PAYMENT'
  | 'REFUND'
  | 'REVERSAL_PURCHASE'
  | 'REVERSAL_WITHDRAWAL'
  | 'REVERSAL_EXTRACASH'
  | 'REVERSAL_BALANCE_INQUIRY'
  | 'REVERSAL_REFUND'
  | 'REVERSAL_PAYMENT';

/** Where the transaction currently sits in its authorization/settlement lifecycle. */
export type CardLifecycleStatus =
  | 'pending_authorization'
  | 'captured'
  | 'authorization_reversed'
  | 'refunded'
  | 'payment_reversed'
  | 'refund_reversed';

export interface CardMerchantInfo {
  id: string;
  name: string;
  /** Merchant category code. */
  mcc: string;
  address: string | null;
  city: string | null;
  country: string | null;
  terminalId?: string;
}

/** How the card was presented/used for this transaction. */
export interface CardTransactionMedium {
  entryMode:
    | 'MANUAL'
    | 'CHIP'
    | 'CONTACTLESS'
    | 'CREDENTIAL_ON_FILE'
    | 'MAG_STRIPE'
    | 'CARDLESS'
    | 'OTHER'
    | 'UNKNOWN';
  pointType: 'ECOMMERCE' | 'POS' | 'ATM' | 'MOTO';
  origin: 'DOMESTIC' | 'INTERNATIONAL';
  network?: 'MASTERCARD' | 'VISA' | 'SERVIBANCA' | 'PROSA';
  source?:
    | 'ONLINE'
    | 'CLEARING'
    | 'PURGE'
    | 'MANUAL'
    | 'CHARGEBACK_MANUAL'
    | 'TRUST_CREDIT_MANUAL';
  cardPresence?: 'PRESENT' | 'NOT_PRESENT';
  cardholderPresence?:
    | 'CARDHOLDER_PRESENCE_PRESENT'
    | 'NOT_PRESENT'
    | 'NOT_PRESENT_MOTO'
    | 'NOT_PRESENT_ARU'
    | 'RECURRING_TRANSACTION'
    | 'NOT_PRESENT_ECOMMERCE';
  cardholderVerificationMethod?: string;
  pinPresence?: 'ONLINE' | 'OFFLINE' | 'NOT_PRESENT';
  pinValidation?: 'VALID' | 'NOT_VALID';
  cvvPresence?: 'PRESENT' | 'NOT_PRESENT';
  cvvValidation?: 'MATCHING' | 'NOT_MATCHING' | 'NOT_PROCESSED';
  tokenizationWalletName?: string | null;
  tokenizationWalletId?: string | null;
}

export interface CardFeeBreakdownEntry {
  feeName: string;
  amount: string;
  rate: number;
}

export interface CardFeeBreakdown {
  total: string;
  fees: CardFeeBreakdownEntry[];
  settlement: string;
}

/**
 * Body POSTed to the card account's `webhookUrl` on every authorization or
 * adjustment. Signed the same way as other Bloque webhooks — verify it
 * before trusting the payload.
 */
export interface CardWebhookPayload {
  accountUrn: string;
  transactionId: string;
  /** `'authorization'` for the initial hold, `'adjustment'` for everything after. */
  type: 'authorization' | 'adjustment';
  direction: 'debit' | 'credit';
  event:
    | 'purchase'
    | 'rejected_insufficient_funds'
    | 'rejected_credit'
    | 'rejected_currency'
    | 'credit_adjustment'
    | 'debit_adjustment'
    | 'cashback_surcharge';
  lifecycleStatus?: CardLifecycleStatus;
  transactionType?: CardTransactionType;
  /** Scaled bigint string at `asset`'s precision. */
  amount?: string;
  asset?: SupportedAsset;
  /** Amount in the transaction's original currency. */
  localAmount?: number;
  /** ISO 4217 currency code, e.g. `"COP"`, `"USD"`. */
  localCurrency?: string;
  exchangeRate?: number;
  merchant?: CardMerchantInfo;
  medium?: CardTransactionMedium;
  feeBreakdown?: CardFeeBreakdown;
  /** Present on `rejected_*` events. */
  reason?: string;
  /** Present on `cashback_surcharge`. */
  requiredUsd?: number;
  currency?: string;
  surchargeTotal?: number;
  programs?: Array<{ name: string; type: string; amount: number }>;
}

/**
 * Generic bank transfer types for @bloque/sdk-swap
 *
 * Supports any Colombian bank as the destination medium for cash-out swaps.
 */

/**
 * Supported Colombian banks for cash-out transfers
 *
 * @example Transfer to Bancolombia
 * ```typescript
 * await bloque.swap.bankTransfer.create({
 *   rateSig: rate.sig,
 *   toMedium: 'bancolombia',
 *   amountSrc: '5000000',
 *   depositInformation: {
 *     bankAccountType: 'savings',
 *     bankAccountNumber: '5740088718',
 *     bankAccountHolderName: 'Juan Pérez',
 *     bankAccountHolderIdentificationType: 'CC',
 *     bankAccountHolderIdentificationValue: '1234567890',
 *   },
 *   args: { sourceAccountUrn: 'did:bloque:card:abc123' },
 * });
 * ```
 *
 * @example Transfer to Banco de Bogotá
 * ```typescript
 * await bloque.swap.bankTransfer.create({
 *   rateSig: rate.sig,
 *   toMedium: 'banco_de_bogota',
 *   amountSrc: '2000000',
 *   depositInformation: {
 *     bankAccountType: 'checking',
 *     bankAccountNumber: '987654321',
 *     bankAccountHolderName: 'María López',
 *     bankAccountHolderIdentificationType: 'CE',
 *     bankAccountHolderIdentificationValue: '456789',
 *   },
 *   args: { sourceAccountUrn: 'did:bloque:card:xyz789' },
 * });
 * ```
 *
 * @example Transfer to BBVA Colombia
 * ```typescript
 * await bloque.swap.bankTransfer.create({
 *   rateSig: rate.sig,
 *   toMedium: 'banco_bbva_colombia',
 *   amountSrc: '10000000',
 *   depositInformation: {
 *     bankAccountType: 'savings',
 *     bankAccountNumber: '1122334455',
 *     bankAccountHolderName: 'Carlos Ruiz',
 *     bankAccountHolderIdentificationType: 'NIT',
 *     bankAccountHolderIdentificationValue: '900123456',
 *   },
 *   args: { sourceAccountUrn: 'did:bloque:card:def456' },
 * });
 * ```
 */
export type SupportedBank =
  | 'banco_agrario_de_colombia'
  | 'banco_av_villas'
  | 'banco_bancamia'
  | 'banco_bbva_colombia'
  | 'banco_btg_pactual_colombia'
  | 'citibank_colombia'
  | 'banco_caja_social_bcsc'
  | 'davibank'
  | 'banco_contactar'
  | 'banco_cooperativo_coopcentral'
  | 'ban100'
  | 'banco_davivienda'
  | 'banco_de_bogota'
  | 'banco_de_occidente'
  | 'banco_gnb_sudameris'
  | 'banco_jp_morgan_colombia'
  | 'banco_popular'
  | 'banco_itau'
  | 'bancolombia'
  | 'banco_w'
  | 'banco_coomeva'
  | 'banco_finandina_bic'
  | 'banco_falabella'
  | 'banco_pichincha'
  | 'banco_santander_de_negocios_colombia'
  | 'banco_mundo_mujer'
  | 'banco_serfinanza'
  | 'mibanco'
  | 'lulo_bank'
  | 'banco_union';

/**
 * Bank account type
 */
export type BankAccountType = 'savings' | 'checking';

/**
 * Identification type for account holder
 */
export type IdentificationType = 'CC' | 'CE' | 'NIT' | 'PP';

/**
 * Bank deposit information for direct bank transfers
 *
 * This is the same shape for all Colombian banks — the specific bank
 * is selected via the `toMedium` parameter in the order.
 */
export interface BankDepositInformation {
  /**
   * Bank account type
   * @example "savings"
   */
  bankAccountType: BankAccountType;

  /**
   * Bank account number
   * @example "5740088718"
   */
  bankAccountNumber: string;

  /**
   * Account holder full name
   * @example "david barinas"
   */
  bankAccountHolderName: string;

  /**
   * Account holder identification type
   * @example "CC"
   */
  bankAccountHolderIdentificationType: IdentificationType;

  /**
   * Account holder identification number
   * @example "123456789"
   */
  bankAccountHolderIdentificationValue: string;
}

/**
 * Kusama account arguments for swap execution
 */
export interface KusamaAccountArgs {
  /**
   * Account URN where funds will be debited from
   * @example "did:bloque:card:1231231"
   */
  sourceAccountUrn: string;
}

/**
 * Order type for swap
 * - 'src': Taker specifies exact source amount to pay
 * - 'dst': Taker specifies exact destination amount to receive
 */
export type OrderType = 'src' | 'dst';

/**
 * Parameters for creating a bank transfer swap order
 */
export interface CreateBankTransferOrderParams {
  /**
   * Rate signature from findRates
   */
  rateSig: string;

  /**
   * Destination bank medium (e.g., "bancolombia", "banco_de_bogota", "banco_davivienda")
   * @example "banco_bbva_colombia"
   */
  toMedium: SupportedBank;

  /**
   * Optional webhook URL for order status notifications
   */
  webhookUrl?: string;

  /**
   * Source amount as bigint string (required if type is 'src')
   * @example "100000000"
   */
  amountSrc?: string;

  /**
   * Destination amount as bigint string (required if type is 'dst')
   * @example "50000000" represents 500000.00 COP
   */
  amountDst?: string;

  /**
   * Order type (default: 'src')
   */
  type?: OrderType;

  /**
   * Bank account information for fund delivery
   */
  depositInformation: BankDepositInformation;

  /**
   * Kusama account arguments for swap execution
   */
  args: KusamaAccountArgs;

  /**
   * Specific node ID to execute (defaults to first node)
   */
  nodeId?: string;

  /**
   * Additional metadata for the order
   */
  metadata?: Record<string, unknown>;
}

/**
 * Swap order details
 */
export interface SwapOrder {
  /** Unique order identifier */
  id: string;
  /** Order signature */
  orderSig: string;
  /** Rate signature used for this order */
  rateSig: string;
  /** Swap signature */
  swapSig: string;
  /** Taker URN */
  taker: string;
  /** Maker URN */
  maker: string;
  /** Source asset */
  fromAsset: string;
  /** Destination asset */
  toAsset: string;
  /** Source medium */
  fromMedium: string;
  /** Destination medium (bank name) */
  toMedium: string;
  /** Source amount */
  fromAmount: string;
  /** Destination amount */
  toAmount: string;
  /** Timestamp when the order was created */
  at: string;
  /** Instruction graph ID for tracking execution */
  graphId: string;
  /** Order status */
  status: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Redirect instructions for completing the payment
 */
export interface ExecutionHow {
  /** Type of action required (e.g., "REDIRECT") */
  type: string;
  /** URL to redirect the user to complete the payment */
  url: string;
}

/**
 * Execution result from auto-execution
 */
export interface ExecutionResult {
  /** Node ID that was executed */
  nodeId: string;
  /** Execution result details */
  result: {
    /** Execution status (e.g., "paused") */
    status: string;
    /** Name of the current step */
    name?: string;
    /** Description of what the user needs to do */
    description?: string;
    /** Instructions for completing this step */
    how?: ExecutionHow;
    /** Callback token for tracking */
    callbackToken?: string;
  };
}

/**
 * Result of creating a bank transfer swap order
 */
export interface CreateBankTransferOrderResult {
  /** The created order */
  order: SwapOrder;
  /** Execution result (if args were provided for auto-execution) */
  execution?: ExecutionResult;
  /** Request ID for tracking */
  requestId: string;
}

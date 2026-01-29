/**
 * Bancolombia swap types for @bloque/sdk-swap
 */

/**
 * Bank account type for Bancolombia deposits
 */
export type BankAccountType = 'savings' | 'checking';

/**
 * Identification type for account holder
 */
export type IdentificationType = 'CC' | 'CE' | 'NIT' | 'PP';

/**
 * Bancolombia deposit information for direct bank deposits
 */
export interface BancolombiaDepositInformation {
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
   * Kusama account URN for source funds
   * @example "did:bloque:card:1231231"
   */
  accountUrn: string;
}

/**
 * Order type for swap
 * - 'src': Taker specifies exact source amount to pay
 * - 'dst': Taker specifies exact destination amount to receive
 */
export type OrderType = 'src' | 'dst';

/**
 * Parameters for creating a Bancolombia swap order
 */
export interface CreateBancolombiaOrderParams {
  /**
   * Rate signature from findRates
   */
  rateSig: string;

  /**
   * Source amount as bigint string (required if type is 'src')
   * @example "100000000" represents the exact amount in KSM smallest unit
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
   * Bancolombia bank account information for fund delivery
   */
  depositInformation: BancolombiaDepositInformation;

  /**
   * Kusama account arguments for swap execution
   */
  args?: KusamaAccountArgs;

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
  /**
   * Unique order identifier
   */
  id: string;

  /**
   * Order signature
   */
  orderSig: string;

  /**
   * Rate signature used for this order
   */
  rateSig: string;

  /**
   * Swap signature
   */
  swapSig: string;

  /**
   * Taker URN
   */
  taker: string;

  /**
   * Maker URN
   */
  maker: string;

  /**
   * Source asset
   */
  fromAsset: string;

  /**
   * Destination asset
   */
  toAsset: string;

  /**
   * Source medium
   */
  fromMedium: string;

  /**
   * Destination medium
   */
  toMedium: string;

  /**
   * Source amount
   */
  fromAmount: string;

  /**
   * Destination amount
   */
  toAmount: string;

  /**
   * Timestamp when the order was created (as string)
   */
  at: string;

  /**
   * Instruction graph ID for tracking execution
   */
  graphId: string;

  /**
   * Order status (pending, in_progress, completed, failed)
   */
  status: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;
}

/**
 * Redirect instructions for completing the payment
 */
export interface ExecutionHow {
  /**
   * Type of action required (e.g., "REDIRECT")
   */
  type: string;

  /**
   * URL to redirect the user to complete the payment
   */
  url: string;
}

/**
 * Execution result from auto-execution
 */
export interface ExecutionResult {
  /**
   * Node ID that was executed
   */
  nodeId: string;

  /**
   * Execution result details
   */
  result: {
    /**
     * Execution status (e.g., "paused")
     */
    status: string;

    /**
     * Name of the current step
     */
    name?: string;

    /**
     * Description of what the user needs to do
     */
    description?: string;

    /**
     * Instructions for completing this step
     */
    how?: ExecutionHow;

    /**
     * Callback token for tracking
     */
    callbackToken?: string;
  };
}

/**
 * Result of creating a Bancolombia swap order
 */
export interface CreateBancolombiaOrderResult {
  /**
   * The created order
   */
  order: SwapOrder;

  /**
   * Execution result (if args were provided for auto-execution)
   */
  execution?: ExecutionResult;

  /**
   * Request ID for tracking
   */
  requestId: string;
}

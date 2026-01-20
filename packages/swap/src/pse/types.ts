export interface Bank {
  /**
   * Financial institution code
   */
  code: string;
  /**
   * Financial institution name
   */
  name: string;
}

export interface ListBanksResult {
  banks: Bank[];
}

// Order types for PSE swap

/**
 * Order type for swap
 * - 'src': Taker specifies exact source amount to pay
 * - 'dst': Taker specifies exact destination amount to receive
 */
export type OrderType = 'src' | 'dst';

/**
 * Deposit information for cash-in (fiat to crypto)
 */
export interface DepositInformationCashIn {
  ledgerAccountId?: string;
}

/**
 * Deposit information for cash-out (crypto to fiat)
 */
export interface DepositInformationCashOut {
  bankCode?: string;
  accountNumber?: string;
  accountType?: string;
}

/**
 * Deposit information union type
 */
export type DepositInformation =
  | DepositInformationCashIn
  | DepositInformationCashOut
  | Record<string, unknown>;

/**
 * PSE payment arguments for auto-execution
 */
export interface PsePaymentArgs {
  /**
   * Bank code from PSE banks list
   */
  bankCode: string;
  /**
   * User type: '0' for natural person, '1' for legal entity
   */
  userType?: string;
}

/**
 * Parameters for creating a PSE swap order
 */
export interface CreatePseOrderParams {
  /**
   * Rate signature from findRates
   */
  rateSig: string;
  /**
   * Destination medium (e.g., 'kreivo', 'bloque')
   */
  toMedium: string;
  /**
   * Source amount as bigint string (required if type is 'src')
   * @example "1000000" represents 10000.00 for COP/2
   */
  amountSrc?: string;
  /**
   * Destination amount as bigint string (required if type is 'dst')
   */
  amountDst?: string;
  /**
   * Order type (default: 'src')
   */
  type?: OrderType;
  /**
   * Deposit information for fund delivery
   */
  depositInformation?: DepositInformation;
  /**
   * PSE payment arguments for auto-execution
   */
  args?: PsePaymentArgs;
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
   * Deposit information
   */
  depositInformation: DepositInformation;
  /**
   * Timestamp when the order was created
   */
  at: number;
  /**
   * Instruction graph ID for tracking execution
   */
  graphId: string;
  /**
   * Order status (pending, in_progress, completed, failed)
   */
  status: string;
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
     * Execution status
     */
    status: string;
    /**
     * Additional arguments
     */
    args?: unknown[];
    /**
     * Description of the result
     */
    description?: string;
    /**
     * PSE checkout URL (if applicable)
     */
    checkoutUrl?: string;
  };
}

/**
 * Result of creating a PSE swap order
 */
export interface CreatePseOrderResult {
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

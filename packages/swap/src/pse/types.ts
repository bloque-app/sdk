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
 * Deposit information for PSE top-up
 */
export interface DepositInformation {
  /**
   * Account URN where funds will be deposited
   * @example "did:bloque:account:card:usr-xxx:crd-xxx"
   */
  urn: string;
}

/**
 * Customer data for PSE payment
 */
export interface PseCustomerData {
  /**
   * Customer's full name
   */
  fullName: string;
}

/**
 * PSE payment arguments for auto-execution
 */
export interface PsePaymentArgs {
  /**
   * Bank code from PSE banks list
   */
  bankCode: string;
  /**
   * User type: 'natural' for natural person, 'juridica' for legal entity
   */
  userType?: 'natural' | 'juridica';
  /**
   * Customer email address
   */
  customerEmail?: string;
  /**
   * User legal ID type (e.g., 'CC', 'NIT', 'CE')
   */
  userLegalIdType?: 'CC' | 'NIT' | 'CE';
  /**
   * User legal ID number
   */
  userLegalId?: string;
  /**
   * Additional customer data
   */
  customerData?: PseCustomerData;
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
   * Deposit information with the account URN where funds will be deposited
   */
  depositInformation: DepositInformation;
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

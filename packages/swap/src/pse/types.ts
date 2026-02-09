import type {
  ExecutionHow,
  ExecutionResult,
  OrderType,
  SwapOrder,
} from '../bank-transfer/types';

// Re-export common swap types
export type { ExecutionHow, ExecutionResult, OrderType, SwapOrder };

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
  /**
   * Customer's phone number
   */
  phoneNumber: string;
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
   * User type: 0 for natural person, 1 for legal entity
   */
  userType: 0 | 1;
  /**
   * Customer email address
   */
  customerEmail: string;
  /**
   * User legal ID type (e.g., 'CC', 'NIT', 'CE')
   */
  userLegalIdType: 'CC' | 'NIT' | 'CE';
  /**
   * User legal ID number
   */
  userLegalId: string;
  /**
   * Additional customer data
   */
  customerData: PseCustomerData;
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
  args: PsePaymentArgs;
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

/**
 * Public types for @bloque/sdk-accounts
 */

/**
 * Supported asset types for transfers and movements
 */
export type SupportedAsset = 'DUSD/6' | 'KSM/12';

/**
 * Parameters for transferring funds between accounts
 */
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
   * Amount to transfer (as string to preserve precision)
   * @example "1000000000000"
   */
  amount: string;
  /**
   * Asset to transfer
   * @example "DUSD/6"
   */
  asset: SupportedAsset;
  /**
   * Optional metadata for the transfer
   * @example { reference: "payment-123", note: "Monthly subscription" }
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a transfer operation
 */
export interface TransferResult {
  /** Unique identifier for the queued transfer */
  queueId: string;
  /** Current status of the transfer */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  /** Human-readable message about the transfer status */
  message: string;
}

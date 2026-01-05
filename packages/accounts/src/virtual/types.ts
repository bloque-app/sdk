/**
 * Parameters for listing virtual accounts
 */
export interface ListVirtualAccountsParams {
  /**
   * URN of the account holder (user or organization) to filter by
   * @example "did:bloque:bloque-root:nestor"
   */
  holderUrn?: string;

  /**
   * URN of a specific virtual account to retrieve
   * @example "did:bloque:account:virtual:275d10a2-0854-4081-9d61-ea506e917335"
   */
  urn?: string;
}

/**
 * Result of listing virtual accounts
 */
export interface ListVirtualAccountsResult {
  /** Array of virtual accounts with balance information */
  accounts: VirtualAccount[];
}

/**
 * Parameters for creating a virtual account
 */
export interface CreateVirtualAccountParams {
  /**
   * URN of the account holder (user or organization)
   *
   * @example "did:bloque:user:123e4567"
   */
  holderUrn?: string;

  /**
   * Account holder's first name
   *
   * @example "John"
   */
  firstName: string;

  /**
   * Account holder's last name
   *
   * @example "Doe"
   */
  lastName: string;

  /**
   * Ledger account ID to associate with the virtual account
   * If not provided, a new ledger account will be created automatically
   */
  ledgerId?: string;

  /**
   * Webhook URL to receive account events
   */
  webhookUrl?: string;

  /**
   * Custom metadata to attach to the virtual account
   * Must be a Record<string, string> (all values must be strings)
   */
  metadata?: Record<string, string>;
}

/**
 * Parameters for updating virtual account metadata
 */
export interface UpdateVirtualMetadataParams {
  /**
   * URN of the virtual account to update
   *
   * @example "did:bloque:mediums:virtual:account:123e4567"
   */
  urn: string;

  /**
   * Metadata to update
   * Note: 'source' is a reserved field and cannot be modified
   */
  metadata: Record<string, string> & {
    source?: never;
  };
}

/**
 * Virtual account response
 */
export interface VirtualAccount {
  /**
   * Unique resource name for the virtual account
   */
  urn: string;

  /**
   * Account ID
   */
  id: string;

  /**
   * Account holder's first name
   */
  firstName: string;

  /**
   * Account holder's last name
   */
  lastName: string;

  /**
   * Account status
   */
  status:
    | 'creation_in_progress'
    | 'active'
    | 'disabled'
    | 'frozen'
    | 'deleted'
    | 'creation_failed';

  /**
   * Owner URN
   */
  ownerUrn: string;

  /**
   * Ledger account ID associated with the virtual account
   */
  ledgerId: string;

  /**
   * Webhook URL (if configured)
   */
  webhookUrl: string | null;

  /**
   * Custom metadata
   */
  metadata?: Record<string, string>;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;

  /**
   * Token balances (optional, included in list responses and after creation)
   */
  balance?: Record<
    string,
    {
      current: string;
      pending: string;
      in: string;
      out: string;
    }
  >;
}

/**
 * Parameters for listing polygon accounts
 */
export interface ListPolygonAccountsParams {
  /**
   * URN of the account holder (user or organization) to filter by
   * @example "did:bloque:bloque-root:nestor"
   */
  holderUrn?: string;

  /**
   * URN of a specific polygon account to retrieve
   * @example "did:bloque:account:polygon:0x05B10c9B6241b73fc8c906fB7979eFc7764AB731"
   */
  urn?: string;
}

/**
 * Result of listing polygon accounts
 */
export interface ListPolygonAccountsResult {
  /** Array of polygon accounts with balance information */
  accounts: PolygonAccount[];
}

/**
 * Parameters for creating a polygon account
 */
export interface CreatePolygonAccountParams {
  /**
   * URN of the account holder (user or organization)
   *
   * @example "did:bloque:user:123e4567"
   */
  holderUrn?: string;

  /**
   * Display name for the polygon account
   */
  name?: string;

  /**
   * Ledger account ID to associate with the polygon account
   * If not provided, a new ledger account will be created automatically
   */
  ledgerId?: string;

  /**
   * Webhook URL to receive account events
   */
  webhookUrl?: string;

  /**
   * Custom metadata to attach to the polygon account
   * Must be a Record<string, string> (all values must be strings)
   */
  metadata?: Record<string, string>;
}

/**
 * Parameters for updating polygon account metadata
 */
export interface UpdatePolygonMetadataParams {
  /**
   * URN of the polygon account to update
   *
   * @example "did:bloque:account:polygon:0x05B10c9B6241b73fc8c906fB7979eFc7764AB731"
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
 * Polygon account response
 */
export interface PolygonAccount {
  /**
   * Unique resource name for the polygon account
   */
  urn: string;

  /**
   * Account ID
   */
  id: string;

  /**
   * Polygon wallet address
   */
  address: string;

  /**
   * Network name (always "polygon")
   */
  network: string;

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
   * Ledger account ID associated with the polygon account
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

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
   * Display name for the virtual account
   */
  name?: string;

  /**
   * Ledger account ID to associate with the virtual account.
   *
   * Pass one to share an existing balance — the account is `active` straight
   * away, since the ledger it points at is already on-chain.
   *
   * Omit it and a new ledger account is minted for you. Its `ledgerId` is
   * derived rather than assigned by the chain, so it comes back in the create
   * response and is immediately usable to link cards and Polygon accounts. The
   * account itself starts `creation_in_progress` and can *receive* right away;
   * it can *send* once the ledger account finishes registering on-chain and the
   * status flips to `active`.
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
   * Ledger account ID associated with the virtual account.
   *
   * This is the ledger account's on-chain address, and it is the value other
   * account types take as their own `ledgerId` to share this balance. Always
   * populated, including on the create response.
   */
  ledgerId: string;

  /**
   * URN of the ledger account backing this virtual account.
   *
   * A stable handle for the same ledger account that `ledgerId` addresses:
   * `ledgerId` is the address, this is the name. Present on accounts whose
   * ledger account was minted for them; absent when the account was attached to
   * a pre-existing `ledgerId`.
   */
  ledgerAccountUrn?: string;

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

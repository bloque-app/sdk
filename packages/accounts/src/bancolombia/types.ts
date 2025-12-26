export interface CreateBancolombiaAccountParams {
  /**
   * URN of the account holder (user or organization)
   *
   * @example "did:bloque:user:123e4567"
   */
  urn: string;
  /**
   * Display name for the card
   */
  name?: string;
  /**
   * Ledger account ID to associate with the Bancolombia account
   */
  ledgerId?: string;
  /**
   * Webhook URL to receive account events
   */
  webhookUrl?: string;
  /**
   * Custom metadata to attach to the Bancolombia account
   */
  metadata?: Record<string, unknown>;
}

export interface UpdateBancolombiaMetadataParams {
  /**
   * URN of the Bancolombia account to update
   *
   * @example "did:bloque:mediums:bancolombia:account:123e4567"
   */
  urn: string;
  /**
   * Metadata to update (name and source are reserved fields and cannot be modified)
   */
  metadata: Record<string, unknown> & {
    name?: never;
    source?: never;
  };
}

/**
 * Bancolombia account response
 */
export interface BancolombiaAccount {
  /**
   * Unique resource name for the Bancolombia account
   */
  urn: string;

  /**
   * Account ID
   */
  id: string;

  /**
   * Reference code for the Bancolombia account
   */
  referenceCode: string;

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
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;
}

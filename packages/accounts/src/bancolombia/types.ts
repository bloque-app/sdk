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
   * URN of an existing card to link with the Bancolombia account
   *
   * @example "did:bloque:card:123e4567"
   */
  cardUrn?: string;

  /**
   * Custom metadata to attach to the Bancolombia account
   */
  metadata?: Record<string, unknown>;
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

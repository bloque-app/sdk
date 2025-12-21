import type { CardType } from '../api-types';

export interface CreateCardParams {
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
}

export interface CardAccount {
  /**
   * Unique resource name for the card account
   */
  urn: string;
  /**
   * Card account ID
   */
  id: string;
  /**
   * Last four digits of the card
   */
  lastFour: string;
  /**
   * Type of card product (CREDIT, DEBIT)
   */
  productType: 'CREDIT' | 'DEBIT';
  /**
   * Current status of the card
   */
  status:
    | 'active'
    | 'disabled'
    | 'frozen'
    | 'deleted'
    | 'creation_in_progress'
    | 'creation_failed';
  /**
   * Type of card (VIRTUAL, PHYSICAL)
   */
  cardType: CardType;
  /**
   * URL to view card details (PCI-compliant)
   */
  detailsUrl: string;

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

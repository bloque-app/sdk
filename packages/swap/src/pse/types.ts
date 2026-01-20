type Currency = 'DUSD/6' | 'COP/2' | 'KSM/12';

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

export interface CreateTopUpParams {
  /**
   * Top-up amount as string (scaled by currency precision)
   */
  amount: string;
  /**
   * Currency with precision (e.g., "DUSD/6")
   */
  currency: Currency;
  /**
   * URL to redirect on successful payment
   */
  successUrl?: string;
  /**
   * Webhook URL for payment notifications
   */
  webhookUrl?: string;
}

export interface PaymentItemResult {
  /**
   * Item name
   */
  name: string;
  /**
   * Item amount (as number)
   */
  amount: number;
  /**
   * Stock keeping unit identifier
   */
  sku?: string;
  /**
   * Item description
   */
  description?: string;
  /**
   * Item quantity
   */
  quantity: number;
  /**
   * URL to item image
   */
  imageUrl?: string;
}

export interface PaymentSummary {
  /**
   * Payment status
   */
  status: string;
}

export interface Payment {
  /**
   * Payment URN identifier
   */
  urn: string;
  /**
   * Owner URN
   */
  ownerUrn: string;
  /**
   * Payment name/title
   */
  name: string;
  /**
   * Payment description
   */
  description?: string;
  /**
   * Currency with precision
   */
  currency: Currency;
  /**
   * Total amount
   */
  amount: number;
  /**
   * Hosted payment URL
   */
  url: string;
  /**
   * Success redirect URL
   */
  successUrl?: string;
  /**
   * Cancel redirect URL
   */
  cancelUrl?: string;
  /**
   * Payment image URL
   */
  imageUrl?: string;
  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
  /**
   * Tax amount
   */
  tax?: number;
  /**
   * Applied discount code
   */
  discountCode?: string;
  /**
   * Webhook URL
   */
  webhookUrl?: string;
  /**
   * Payout route configuration
   */
  payoutRoute: unknown[];
  /**
   * Payment summary
   */
  summary: PaymentSummary;
  /**
   * Expiration date
   */
  expiresAt?: string;
  /**
   * Creation timestamp
   */
  createdAt: string;
  /**
   * Last update timestamp
   */
  updatedAt: string;
  /**
   * Payment type
   */
  paymentType: string;
  /**
   * Payment items
   */
  items: PaymentItemResult[];
}

export interface CreateTopUpResult {
  payment: Payment;
}

export interface PsePayee {
  /**
   * Full name of the payee
   */
  name: string;
  /**
   * Email address
   */
  email: string;
  /**
   * ID document type (e.g., "CC" for Cédula de Ciudadanía)
   */
  idType: string;
  /**
   * ID document number
   */
  idNumber: string;
}

export type PersonType = 'natural' | 'juridica';

export interface InitiatePsePaymentParams {
  /**
   * Payment URN from createTopUp
   */
  paymentUrn: string;
  /**
   * Payee information
   */
  payee: PsePayee;
  /**
   * Person type (natural or juridica)
   */
  personType: PersonType;
  /**
   * Bank code from banks list
   */
  bankCode: string;
}

export interface InitiatePsePaymentResult {
  /**
   * Payment ID
   */
  paymentId: string;
  /**
   * Payment status
   */
  status: string;
  /**
   * Status message
   */
  message: string;
  /**
   * Payment amount
   */
  amount: string;
  /**
   * Currency
   */
  currency: Currency;
  /**
   * PSE checkout URL to redirect the user
   */
  checkoutUrl: string;
  /**
   * Order ID
   */
  orderId: string;
  /**
   * Order status
   */
  orderStatus: string;
  /**
   * Creation timestamp
   */
  createdAt: string;
}

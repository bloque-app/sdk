import { BaseClient } from '@bloque/sdk-core';
import type {
  CreatePaymentInput,
  CreatePaymentResponse,
  InitiatePsePaymentInput,
  InitiatePsePaymentResponse,
  ListPseBanksResponse,
  PaymentItemResponse,
  PaymentResponse,
  PseBank,
} from '../internal/wire-types';
import type {
  Bank,
  CreateTopUpParams,
  CreateTopUpResult,
  InitiatePsePaymentParams,
  InitiatePsePaymentResult,
  ListBanksResult,
  Payment,
  PaymentItemResult,
} from './types';

/**
 * PSE client for PSE-related utilities
 *
 * Provides access to PSE (Pagos Seguros en Línea) utilities like bank listing.
 */
export class PseClient extends BaseClient {
  /**
   * List available PSE banks
   *
   * Retrieves the list of financial institutions available for PSE payments.
   *
   * @returns Promise resolving to list of banks
   *
   * @example
   * ```typescript
   * const result = await bloque.swap.pse.banks();
   *
   * for (const bank of result.banks) {
   *   console.log(`${bank.code}: ${bank.name}`);
   * }
   * ```
   */
  async banks(): Promise<ListBanksResult> {
    const response = await this.httpClient.request<ListPseBanksResponse>({
      method: 'GET',
      path: '/api/utils/pse/banks',
    });

    return {
      banks: response.banks.map((bank) => this._mapBankResponse(bank)),
    };
  }

  /**
   * Create a PSE top-up
   *
   * Creates a payment intent for a PSE top-up/recharge.
   * Use the returned payment URN with initiatePayment() to start the PSE flow.
   *
   * @param params - Top-up creation parameters
   * @returns Promise resolving to the created payment
   *
   * @example
   * ```typescript
   * const result = await bloque.swap.pse.createTopUp({
   *   amount: '50000000',
   *   currency: 'DUSD/6',
   *   successUrl: 'https://example.com/payment/success',
   *   webhookUrl: 'https://myapp.com/webhooks/payment',
   * });
   *
   * // Use the URN to initiate PSE payment
   * console.log(result.payment.urn);
   * ```
   */
  async createTopUp(params: CreateTopUpParams): Promise<CreateTopUpResult> {
    const input: CreatePaymentInput = {
      name: 'PSE Top-up',
      description: 'PSE Top-up',
      currency: params.currency,
      payment_type: 'shopping_cart',
      items: [
        {
          name: 'PSE Top-up',
          amount: params.amount,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      webhook_url: params.webhookUrl,
    };

    const response = await this.httpClient.request<CreatePaymentResponse>({
      method: 'POST',
      path: '/api/payments',
      body: input,
    });

    return {
      payment: this._mapPaymentResponse(response.payment),
    };
  }

  /**
   * Initiate a PSE payment
   *
   * Initiates the PSE payment flow for a previously created top-up.
   * Returns a checkout URL where the user should be redirected to complete the payment.
   *
   * @param params - PSE payment parameters
   * @returns Promise resolving to PSE payment result with checkout URL
   *
   * @example
   * ```typescript
   * // First create a top-up
   * const topUp = await bloque.swap.pse.createTopUp({...});
   *
   * // Then initiate PSE payment with user details
   * const result = await bloque.swap.pse.initiatePayment({
   *   paymentUrn: topUp.payment.urn,
   *   payee: {
   *     name: 'Juan Pérez García',
   *     email: 'juan.perez@example.com',
   *     idType: 'CC',
   *     idNumber: '1055228746',
   *   },
   *   personType: 'natural',
   *   bankCode: '1',
   * });
   *
   * // Redirect user to PSE
   * window.location.href = result.checkoutUrl;
   * ```
   */
  async initiatePayment(
    params: InitiatePsePaymentParams,
  ): Promise<InitiatePsePaymentResult> {
    const input: InitiatePsePaymentInput = {
      payment_urn: params.paymentUrn,
      payee: {
        name: params.payee.name,
        email: params.payee.email,
        id_type: params.payee.idType,
        id_number: params.payee.idNumber,
      },
      person_type: params.personType,
      bank_code: params.bankCode,
    };

    const response = await this.httpClient.request<InitiatePsePaymentResponse>({
      method: 'POST',
      path: '/api/payments/pse',
      body: input,
    });

    return {
      paymentId: response.payment_id,
      status: response.status,
      message: response.message,
      amount: response.amount,
      currency: response.currency,
      checkoutUrl: response.checkout_url,
      orderId: response.order_id,
      orderStatus: response.order_status,
      createdAt: response.created_at,
    };
  }

  /**
   * Maps API bank response to SDK format
   * @internal
   */
  private _mapBankResponse(bank: PseBank): Bank {
    return {
      code: bank.financial_institution_code,
      name: bank.financial_institution_name,
    };
  }

  /**
   * Maps API payment response to SDK format
   * @internal
   */
  private _mapPaymentResponse(payment: PaymentResponse): Payment {
    return {
      urn: payment.urn,
      ownerUrn: payment.owner_urn,
      name: payment.name,
      description: payment.description,
      currency: payment.currency,
      amount: payment.amount,
      url: payment.url,
      successUrl: payment.success_url,
      cancelUrl: payment.cancel_url,
      imageUrl: payment.image_url,
      metadata: payment.metadata,
      tax: payment.tax,
      discountCode: payment.discount_code,
      webhookUrl: payment.webhook_url,
      payoutRoute: payment.payout_route,
      summary: {
        status: payment.summary.status,
      },
      expiresAt: payment.expires_at,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      paymentType: payment.payment_type,
      items: payment.items.map((item) => this._mapPaymentItemResponse(item)),
    };
  }

  /**
   * Maps API payment item response to SDK format
   * @internal
   */
  private _mapPaymentItemResponse(
    item: PaymentItemResponse,
  ): PaymentItemResult {
    return {
      name: item.name,
      amount: item.amount,
      sku: item.sku,
      description: item.description,
      quantity: item.quantity,
      imageUrl: item.image_url,
    };
  }
}

import { BaseClient, BloqueConfigError } from '@bloque/sdk-core';
import type {
  CreateOrderInput,
  CreateOrderResponse,
  ListPseBanksResponse,
  OrderResponse,
  PseBank,
  DepositInformation as WireDepositInformation,
  ExecutionResult as WireExecutionResult,
} from '../internal/wire-types';
import type {
  Bank,
  CreatePseOrderParams,
  CreatePseOrderResult,
  DepositInformation,
  ExecutionResult,
  ListBanksResult,
  SwapOrder,
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
   * Create a PSE swap order
   *
   * Creates a swap order using PSE as the source payment medium.
   * Optionally auto-executes the first instruction node if args are provided.
   *
   * @param params - PSE order parameters
   * @returns Promise resolving to the created order with optional execution result
   *
   * @example
   * ```typescript
   * // First find available rates
   * const rates = await bloque.swap.findRates({
   *   fromAsset: 'COP/2',
   *   toAsset: 'DUSD/6',
   *   fromMediums: ['pse'],
   *   toMediums: ['kusama'],
   *   amountSrc: '10000000'
   * });
   *
   * // Create order with auto-execution
   * const result = await bloque.swap.pse.create({
   *   rateSig: rates.rates[0].sig,
   *   toMedium: 'kusama',
   *   amountSrc: '10000000',
   *   depositInformation: {
   *     urn: 'did:bloque:account:card:usr-xxx:crd-xxx'
   *   },
   *   args: {
   *     bankCode: '1',
   *     userType: 'natural',
   *     customerEmail: 'user@example.com',
   *     userLegalIdType: 'CC',
   *     userLegalId: '1234567890',
   *     customerData: {
   *       fullName: 'John Doe'
   *     }
   *   }
   * });
   *
   * // If execution returned a checkout URL, redirect user
   * if (result.execution?.result.checkoutUrl) {
   *   window.location.href = result.execution.result.checkoutUrl;
   * }
   * ```
   */
  async create(params: CreatePseOrderParams): Promise<CreatePseOrderResult> {
    const takerUrn = this.httpClient.urn;
    if (!takerUrn) {
      throw new BloqueConfigError(
        'User URN is not available. Please connect to a session first.',
      );
    }

    const orderType = params.type ?? 'src';

    const input: CreateOrderInput = {
      taker_urn: takerUrn,
      type: orderType,
      rate_sig: params.rateSig,
      from_medium: 'pse',
      to_medium: params.toMedium,
      deposit_information: this._mapDepositInformationToWire(
        params.depositInformation,
      ),
    };

    if (orderType === 'src' && params.amountSrc) {
      input.amount_src = params.amountSrc;
    } else if (orderType === 'dst' && params.amountDst) {
      input.amount_dst = params.amountDst;
    }

    if (params.args) {
      input.args = {
        bank_code: params.args.bankCode,
        ...(params.args.userType && { user_type: params.args.userType }),
        ...(params.args.customerEmail && {
          customer_email: params.args.customerEmail,
        }),
        ...(params.args.userLegalIdType && {
          user_legal_id_type: params.args.userLegalIdType,
        }),
        ...(params.args.userLegalId && {
          user_legal_id: params.args.userLegalId,
        }),
        ...(params.args.customerData && {
          customer_data: {
            full_name: params.args.customerData.fullName,
            phone_number: params.args.customerData.phoneNumber,
          },
        }),
      };
    }

    if (params.nodeId) {
      input.node_id = params.nodeId;
    }

    if (params.metadata) {
      input.metadata = params.metadata;
    }

    const response = await this.httpClient.request<CreateOrderResponse>({
      method: 'PUT',
      path: '/api/order',
      body: input,
    });

    return {
      order: this._mapOrderResponse(response.result.order),
      execution: response.result.execution
        ? this._mapExecutionResult(response.result.execution)
        : undefined,
      requestId: response.req_id,
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
   * Maps SDK deposit information to wire format
   * @internal
   */
  private _mapDepositInformationToWire(
    depositInfo: DepositInformation,
  ): WireDepositInformation {
    return { urn: depositInfo.urn };
  }

  /**
   * Maps API order response to SDK format
   * @internal
   */
  private _mapOrderResponse(order: OrderResponse): SwapOrder {
    return {
      id: order.id,
      orderSig: order.order_sig,
      rateSig: order.rate_sig,
      swapSig: order.swap_sig,
      taker: order.taker,
      maker: order.maker,
      fromAsset: order.from_asset,
      toAsset: order.to_asset,
      fromMedium: order.from_medium,
      toMedium: order.to_medium,
      fromAmount: order.from_amount,
      toAmount: order.to_amount,
      at: order.at,
      graphId: order.graph_id,
      status: order.status,
      metadata: order.metadata,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  /**
   * Maps API execution result to SDK format
   * @internal
   */
  private _mapExecutionResult(execution: WireExecutionResult): ExecutionResult {
    return {
      nodeId: execution.node_id,
      result: {
        status: execution.result.status,
        name: execution.result.name,
        description: execution.result.description,
        how: execution.result.how,
        callbackToken: execution.result.callback_token,
      },
    };
  }
}

import { BaseClient, BloqueConfigError } from '@bloque/sdk-core';
import type {
  CreateOrderInput,
  CreateOrderResponse,
  OrderResponse,
  BancolombiaDepositInformation as WireBankDepositInformation,
  ExecutionResult as WireExecutionResult,
} from '../internal/wire-types';
import type {
  BankDepositInformation,
  CreateBankTransferOrderParams,
  CreateBankTransferOrderResult,
  ExecutionResult,
  SwapOrder,
} from './types';

/**
 * Generic bank transfer client for cash-out swaps
 *
 * Supports any Colombian bank as the destination medium.
 * The specific bank is selected via the `toMedium` parameter when creating an order.
 *
 * @example
 * ```typescript
 * const result = await bloque.swap.bankTransfer.create({
 *   rateSig: rate.sig,
 *   toMedium: 'banco_de_bogota',
 *   amountSrc: '5000000',
 *   depositInformation: {
 *     bankAccountType: 'savings',
 *     bankAccountNumber: '123456789',
 *     bankAccountHolderName: 'Juan Pérez',
 *     bankAccountHolderIdentificationType: 'CC',
 *     bankAccountHolderIdentificationValue: '1234567890',
 *   },
 *   args: { accountUrn: 'did:bloque:card:abc123' },
 * });
 * ```
 */
export class BankTransferClient extends BaseClient {
  /**
   * Create a bank transfer swap order
   *
   * Creates a swap order using Kusama as the source and any supported
   * Colombian bank as the destination. The target bank is specified
   * via `params.toMedium`.
   *
   * @param params - Bank transfer order parameters
   * @returns Promise resolving to the created order with optional execution result
   */
  async create(
    params: CreateBankTransferOrderParams,
  ): Promise<CreateBankTransferOrderResult> {
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
      from_medium: 'kusama',
      to_medium: params.toMedium,
      webhook_url: params.webhookUrl,
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
        account_urn: params.args.sourceAccountUrn,
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
   * Maps SDK deposit information to wire format
   * @internal
   */
  private _mapDepositInformationToWire(
    depositInfo: BankDepositInformation,
  ): WireBankDepositInformation {
    return {
      bank_account_type: depositInfo.bankAccountType,
      bank_account_number: depositInfo.bankAccountNumber,
      bank_account_holder_name: depositInfo.bankAccountHolderName,
      bank_account_holder_identification_type:
        depositInfo.bankAccountHolderIdentificationType,
      bank_account_holder_identification_value:
        depositInfo.bankAccountHolderIdentificationValue,
    };
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

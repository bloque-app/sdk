import { BaseClient, BloqueConfigError } from '@bloque/sdk-core';
import { mapExecutionHow } from '../internal/map-execution';
import type {
  CreateOrderInput,
  CreateOrderResponse,
  OrderResponse,
  DepositInformation as WireDepositInformation,
  ExecutionResult as WireExecutionResult,
} from '../internal/wire-types';
import type {
  CreateExternalUsBankOrderOptions,
  CreateExternalUsBankOrderParams,
  CreateExternalUsBankOrderResult,
  ExecutionResult,
  SwapOrder,
} from './types';

/**
 * External US bank client for ACH on-ramp (US bank → Kusama DUSD).
 */
export class ExternalUsBankSwapClient extends BaseClient {
  /**
   * Create an external US bank on-ramp order (ACH pull → DUSD on Kusama).
   *
   * @param params - Order parameters including ledger account and linked bank
   * @returns Promise resolving to the created order
   *
   * @example
   * ```typescript
   * const rates = await bloque.swap.findRates({
   *   fromAsset: 'USD/2',
   *   toAsset: 'DUSD/6',
   *   fromMediums: ['external-us-bank'],
   *   toMediums: ['kusama'],
   *   amountSrc: '10000',
   * });
   *
   * const result = await bloque.swap.externalUsBank.create({
   *   rateSig: rates.rates[0].sig,
   *   amountSrc: '10000',
   *   depositInformation: {
   *     ledgerAccountId: 'ledger-user-001',
   *   },
   *   args: {
   *     sourceAccountUrn: 'did:bloque:account:external-us-bank:abc123',
   *   },
   * });
   * ```
   */
  async create(
    params: CreateExternalUsBankOrderParams,
    options?: CreateExternalUsBankOrderOptions,
  ): Promise<CreateExternalUsBankOrderResult> {
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
      from_medium: 'external-us-bank',
      to_medium: 'kusama',
      webhook_url: params.webhookUrl,
      deposit_information: {
        ledger_account_id: params.depositInformation.ledgerAccountId,
      },
      args: {
        account_urn: params.args.sourceAccountUrn,
      },
    };

    if (orderType === 'src' && params.amountSrc) {
      input.amount_src = params.amountSrc;
    } else if (orderType === 'dst' && params.amountDst) {
      input.amount_dst = params.amountDst;
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
      headers: options?.idempotencyKey
        ? { 'Idempotency-Key': options.idempotencyKey }
        : undefined,
    });

    return {
      order: this._mapOrderResponse(response.result.order),
      execution: response.result.execution
        ? this._mapExecutionResult(response.result.execution)
        : undefined,
      requestId: response.req_id,
    };
  }

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
      webhookUrl: order.webhook_url,
      failureReason: order.failure_reason,
      failureDetails: order.failure_details,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  private _mapExecutionResult(execution: WireExecutionResult): ExecutionResult {
    return {
      nodeId: execution.node_id,
      result: {
        status: execution.result.status,
        name: execution.result.name,
        description: execution.result.description,
        how: execution.result.how
          ? mapExecutionHow(execution.result.how)
          : undefined,
        callbackToken: execution.result.callback_token,
      },
    };
  }
}

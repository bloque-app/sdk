import {
  BaseClient,
  BloqueConfigError,
  operationApprovalHeaders,
} from '@bloque/sdk-core';
import { mapExecutionHow } from '../internal/map-execution';
import type {
  CreateOrderInput,
  CreateOrderResponse,
  OrderResponse,
  ExecutionResult as WireExecutionResult,
} from '../internal/wire-types';
import type {
  CreatePolygonOrderOptions,
  CreatePolygonOrderParams,
  CreatePolygonOrderResult,
  ExecutionResult,
  SwapOrder,
} from './types';

const POLYGON_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = /^0x0{40}$/;

/**
 * Polygon client: withdraw a USDC balance to a Polygon address.
 */
export class PolygonClient extends BaseClient {
  /**
   * Withdraw a USDC balance to a Polygon address (`kusama` → `polygon`,
   * `BUSDC/6` → `USDC/6`).
   *
   * The account owner approves the withdrawal with their passkey: the first
   * call throws `BloqueApprovalRequiredError` with an `approvalUrl`. Wrap the
   * call in `withApproval` to wait for the approval and repeat it once.
   *
   * @param params - Order parameters including the destination address
   * @param options - Idempotency key and approval options
   * @returns Promise resolving to the created order
   * @throws {BloqueConfigError} If the wallet address or source account is
   * invalid, or there is no session
   *
   * @example
   * ```typescript
   * const rates = await bloque.swap.findRates({
   *   fromAsset: 'BUSDC/6',
   *   toAsset: 'USDC/6',
   *   fromMediums: ['kusama'],
   *   toMediums: ['polygon'],
   *   amountSrc: '1000000',
   * });
   *
   * const result = await withApproval(
   *   (approval) =>
   *     bloque.swap.polygon.create(
   *       {
   *         rateSig: rates.rates[0].sig,
   *         amountSrc: '1000000',
   *         depositInformation: { walletAddress: '0x…' },
   *         args: { sourceAccountUrn: 'did:bloque:account:virtual:…' },
   *       },
   *       { approval },
   *     ),
   *   {
   *     onApprovalRequired: (error) =>
   *       console.log('Approve with your passkey:', error.approvalUrl),
   *   },
   * );
   * ```
   */
  async create(
    params: CreatePolygonOrderParams,
    options?: CreatePolygonOrderOptions,
  ): Promise<CreatePolygonOrderResult> {
    const takerUrn = this.httpClient.urn;
    if (!takerUrn) {
      throw new BloqueConfigError(
        'User URN is not available. Please connect to a session first.',
      );
    }

    const walletAddress = params.depositInformation?.walletAddress?.trim();
    if (
      !walletAddress ||
      !POLYGON_ADDRESS.test(walletAddress) ||
      ZERO_ADDRESS.test(walletAddress)
    ) {
      throw new BloqueConfigError(
        'depositInformation.walletAddress must be a Polygon address: 0x followed by 40 hex characters, and not the zero address',
      );
    }

    const sourceAccountUrn = params.args?.sourceAccountUrn?.trim();
    if (!sourceAccountUrn) {
      throw new BloqueConfigError('args.sourceAccountUrn is required');
    }

    const orderType = params.type ?? 'src';

    const input: CreateOrderInput = {
      taker_urn: takerUrn,
      type: orderType,
      rate_sig: params.rateSig,
      from_medium: 'kusama',
      to_medium: 'polygon',
      webhook_url: params.webhookUrl,
      deposit_information: { wallet_address: walletAddress },
      args: { account_urn: sourceAccountUrn },
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
      headers: operationApprovalHeaders(options),
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

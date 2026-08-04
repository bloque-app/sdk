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
  CreateBrebDepositOptions,
  CreateBrebDepositParams,
  CreateBrebDepositResult,
  CreateBrebOrderOptions,
  CreateBrebOrderParams,
  CreateBrebOrderResult,
  ExecutionResult,
  SwapOrder,
} from './types';

export class BrebClient extends BaseClient {
  /**
   * Create a BRE-B payout order (Kusama → BRE-B COP cash-out). Converts
   * `params.args.sourceAccountUrn`'s own Kusama balance and pays it out to
   * `params.depositInformation.destinationKey` — any valid BRE-B key,
   * independent of the source account.
   */
  async create(
    params: CreateBrebOrderParams,
    options?: CreateBrebOrderOptions,
  ): Promise<CreateBrebOrderResult> {
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
      to_medium: 'breb',
      webhook_url: params.webhookUrl,
      deposit_information: this._mapPayoutDepositInformationToWire(
        params.depositInformation,
      ),
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

  /**
   * Create a BRE-B on-ramp deposit order (COP via BRE-B → Kusama).
   *
   * When `args` is provided (even `{}`), the first node auto-executes and the
   * response pauses with a one-time BRE-B key in `execution.result.how`.
   */
  async createDeposit(
    params: CreateBrebDepositParams,
    options?: CreateBrebDepositOptions,
  ): Promise<CreateBrebDepositResult> {
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
      from_medium: 'breb',
      to_medium: 'kusama',
      webhook_url: params.webhookUrl,
      deposit_information: {
        urn: params.depositInformation.urn,
      },
    };

    if (orderType === 'src' && params.amountSrc) {
      input.amount_src = params.amountSrc;
    } else if (orderType === 'dst' && params.amountDst) {
      input.amount_dst = params.amountDst;
    }

    if (params.args !== undefined) {
      input.args = params.args;
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

  private _mapPayoutDepositInformationToWire(
    depositInfo: CreateBrebOrderParams['depositInformation'],
  ): WireDepositInformation {
    return {
      resolution_id: depositInfo.resolutionId,
      destination_key: {
        key_value: depositInfo.destinationKey.keyValue,
        key_type: depositInfo.destinationKey.keyType,
        ...(depositInfo.destinationKey.displayName
          ? { display_name: depositInfo.destinationKey.displayName }
          : {}),
      },
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

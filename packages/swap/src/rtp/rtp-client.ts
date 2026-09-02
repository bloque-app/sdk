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
  CreateRtpOrderOptions,
  CreateRtpOrderParams,
  CreateRtpOrderResult,
  ExecutionResult,
  RtpDepositInformation,
  SwapOrder,
} from './types';

/**
 * RTP client for US instant bank payouts (Kusama DUSD or Base USDC → US bank).
 */
export class RtpClient extends BaseClient {
  /**
   * Create an RTP payout swap order (DUSD on Kusama or USDC on Base → USD to
   * a US bank).
   *
   * Omit `fromMedium` (or pass `'kusama'`) to debit DUSD from a Kusama
   * account. Pass `fromMedium: 'base'` with `args.txHash` to cash out USDC
   * already sent to the source EVM account on Base.
   *
   * @param params - RTP order parameters including destination bank details
   * @returns Promise resolving to the created order
   *
   * @example
   * ```typescript
   * const rates = await bloque.swap.findRates({
   *   fromAsset: 'DUSD/6',
   *   toAsset: 'USD/2',
   *   fromMediums: ['kusama'],
   *   toMediums: ['rtp'],
   *   amountSrc: '100000000',
   * });
   *
   * const result = await bloque.swap.rtp.create({
   *   rateSig: rates.rates[0].sig,
   *   amountSrc: '100000000',
   *   depositInformation: {
   *     owner: 'Jane Doe',
   *     accountNumber: '1234567890',
   *     routingNumber: '063108680',
   *     accountType: 'checking',
   *   },
   *   args: { sourceAccountUrn: 'did:bloque:account:kusama-user-001' },
   * });
   * ```
   *
   * @example
   * ```typescript
   * const rates = await bloque.swap.findRates({
   *   fromAsset: 'USDC/6',
   *   toAsset: 'USD/2',
   *   fromMediums: ['base'],
   *   toMediums: ['rtp'],
   *   amountSrc: '100000000',
   * });
   *
   * const result = await bloque.swap.rtp.create({
   *   rateSig: rates.rates[0].sig,
   *   amountSrc: '100000000',
   *   fromMedium: 'base',
   *   depositInformation: {
   *     owner: 'Jane Doe',
   *     accountNumber: '1234567890',
   *     routingNumber: '063108680',
   *     accountType: 'checking',
   *   },
   *   args: {
   *     sourceAccountUrn: 'did:bloque:account:polygon:abc123',
   *     txHash: '0xabc…',
   *   },
   * });
   * ```
   */
  async create(
    params: CreateRtpOrderParams,
    options?: CreateRtpOrderOptions,
  ): Promise<CreateRtpOrderResult> {
    const takerUrn = this.httpClient.urn;
    if (!takerUrn) {
      throw new BloqueConfigError(
        'User URN is not available. Please connect to a session first.',
      );
    }

    const orderType = params.type ?? 'src';
    const fromMedium = params.fromMedium ?? 'kusama';

    const input: CreateOrderInput = {
      taker_urn: takerUrn,
      type: orderType,
      rate_sig: params.rateSig,
      from_medium: fromMedium,
      to_medium: 'rtp',
      webhook_url: params.webhookUrl,
      deposit_information: this._mapDepositInformationToWire(
        params.depositInformation,
      ),
      args: this._mapArgs(fromMedium, params.args),
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

  private _mapArgs(
    fromMedium: 'kusama' | 'base',
    args: CreateRtpOrderParams['args'],
  ): Record<string, unknown> {
    if (fromMedium === 'base') {
      const txHash = args.txHash?.trim();
      if (!txHash) {
        throw new BloqueConfigError(
          'fromMedium "base" requires args.txHash of the USDC transfer on Base.',
        );
      }
      return {
        urn: args.sourceAccountUrn,
        tx_hash: txHash,
      };
    }

    return {
      account_urn: args.sourceAccountUrn,
    };
  }

  private _mapDepositInformationToWire(
    depositInfo: RtpDepositInformation,
  ): WireDepositInformation {
    return {
      owner: depositInfo.owner,
      account_number: depositInfo.accountNumber,
      routing_number: depositInfo.routingNumber,
      account_type: depositInfo.accountType,
      ...(depositInfo.bankName && { bank_name: depositInfo.bankName }),
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

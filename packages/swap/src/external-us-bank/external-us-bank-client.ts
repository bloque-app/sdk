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
 * External US bank client for ACH on-ramp (US bank → Kusama DUSD or Base USDC).
 */
export class ExternalUsBankSwapClient extends BaseClient {
  /**
   * Create an external US bank on-ramp order (ACH pull → DUSD on Kusama, or
   * USDC on Base).
   *
   * Omit `toMedium` (or pass `'kusama'`) and supply
   * `depositInformation.ledgerAccountId` for the Kusama path. Pass
   * `toMedium: 'base'` with `depositInformation.walletAddress` to land USDC
   * on Base at that 0x.
   *
   * @param params - Order parameters including destination and linked bank
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
   *
   * @example
   * ```typescript
   * const rates = await bloque.swap.findRates({
   *   fromAsset: 'USD/2',
   *   toAsset: 'USDC/6',
   *   fromMediums: ['external-us-bank'],
   *   toMediums: ['base'],
   *   amountSrc: '10000',
   * });
   *
   * const result = await bloque.swap.externalUsBank.create({
   *   rateSig: rates.rates[0].sig,
   *   amountSrc: '10000',
   *   toMedium: 'base',
   *   depositInformation: {
   *     walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
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
    const toMedium = params.toMedium ?? 'kusama';
    const deposit_information = this._mapDepositInformation(
      toMedium,
      params.depositInformation,
    );

    const input: CreateOrderInput = {
      taker_urn: takerUrn,
      type: orderType,
      rate_sig: params.rateSig,
      from_medium: 'external-us-bank',
      to_medium: toMedium,
      webhook_url: params.webhookUrl,
      deposit_information,
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

  private _mapDepositInformation(
    toMedium: 'kusama' | 'base',
    depositInformation: CreateExternalUsBankOrderParams['depositInformation'],
  ): WireDepositInformation {
    if (toMedium === 'base') {
      if (
        !('walletAddress' in depositInformation) ||
        !depositInformation.walletAddress.trim()
      ) {
        throw new BloqueConfigError(
          'toMedium "base" requires depositInformation.walletAddress (0x on Base).',
        );
      }
      return {
        wallet_address: depositInformation.walletAddress,
        ...(depositInformation.walletName
          ? { wallet_name: depositInformation.walletName }
          : {}),
      };
    }

    if (
      !('ledgerAccountId' in depositInformation) ||
      !depositInformation.ledgerAccountId.trim()
    ) {
      throw new BloqueConfigError(
        'toMedium "kusama" requires depositInformation.ledgerAccountId.',
      );
    }
    return {
      ledger_account_id: depositInformation.ledgerAccountId,
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

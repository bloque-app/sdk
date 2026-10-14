import {
  BaseClient,
  BloqueConfigError,
  operationApprovalHeaders,
} from '@bloque/sdk-core';
import type { ExecutionResult, SwapOrder } from '../bank-transfer/types';
import { mapExecutionHow } from '../internal/map-execution';
import type {
  CreateOrderInput,
  CreateOrderResponse,
  OrderResponse,
  ExecutionResult as WireExecutionResult,
} from '../internal/wire-types';
import type {
  CreateSpeiDepositParams,
  CreateSpeiOrderOptions,
  CreateSpeiOrderParams,
  CreateSpeiOrderResult,
  SpeiDepositInformation,
  SpeiPayoutInformation,
} from './types';

/** SPEI pay-ins (MXN → MXNB) and payouts (MXNB → MXN). */
export class SpeiClient extends BaseClient {
  async createDeposit(
    params: CreateSpeiDepositParams,
    options?: CreateSpeiOrderOptions,
  ): Promise<CreateSpeiOrderResult> {
    this._validateDepositInformation(params.depositInformation);
    return this._create(
      params,
      {
        urn: params.depositInformation.urn.trim(),
        payer_name: params.depositInformation.payerName.trim(),
        ...(params.depositInformation.payerDocumentNumber?.trim()
          ? {
              payer_document_number:
                params.depositInformation.payerDocumentNumber.trim(),
            }
          : {}),
      },
      'spei',
      'kusama',
      options,
    );
  }

  async create(
    params: CreateSpeiOrderParams,
    options?: CreateSpeiOrderOptions,
  ): Promise<CreateSpeiOrderResult> {
    this._validatePayoutInformation(params.depositInformation);
    return this._create(
      params,
      {
        clabe: params.depositInformation.clabe,
        beneficiary_name: params.depositInformation.beneficiaryName.trim(),
        ...(params.depositInformation.rfc?.trim()
          ? { rfc: params.depositInformation.rfc.trim() }
          : {}),
      },
      'kusama',
      'spei',
      options,
    );
  }

  private async _create(
    params: CreateSpeiDepositParams | CreateSpeiOrderParams,
    depositInformation: CreateOrderInput['deposit_information'],
    fromMedium: 'spei' | 'kusama',
    toMedium: 'kusama' | 'spei',
    options?: CreateSpeiOrderOptions,
  ): Promise<CreateSpeiOrderResult> {
    this._validateOrderParams(params);
    const takerUrn = this.httpClient.urn;
    if (!takerUrn) {
      throw new BloqueConfigError(
        'User URN is not available. Please connect to a session first.',
      );
    }

    const type = params.type ?? 'src';
    const input: CreateOrderInput = {
      taker_urn: takerUrn,
      type,
      rate_sig: params.rateSig,
      from_medium: fromMedium,
      to_medium: toMedium,
      webhook_url: params.webhookUrl,
      deposit_information: depositInformation,
      args: {},
    };

    if (type === 'src' && params.amountSrc) input.amount_src = params.amountSrc;
    if (type === 'dst' && params.amountDst) input.amount_dst = params.amountDst;
    if (params.nodeId) input.node_id = params.nodeId;
    if (params.metadata) input.metadata = params.metadata;

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

  private _validateOrderParams(
    params: CreateSpeiDepositParams | CreateSpeiOrderParams,
  ): void {
    if (!params.rateSig.trim()) {
      throw new BloqueConfigError('rateSig is required');
    }
    const type = params.type ?? 'src';
    const amount = type === 'src' ? params.amountSrc : params.amountDst;
    if (!amount || !/^\d+$/.test(amount) || BigInt(amount) <= 0n) {
      throw new BloqueConfigError(
        type === 'src'
          ? 'amountSrc must be a positive integer string when type is "src"'
          : 'amountDst must be a positive integer string when type is "dst"',
      );
    }
  }

  private _validateDepositInformation(info: SpeiDepositInformation): void {
    if (!info.urn.trim())
      throw new BloqueConfigError('depositInformation.urn is required');
    if (info.payerName.trim().length < 2) {
      throw new BloqueConfigError(
        'depositInformation.payerName must be at least 2 characters',
      );
    }
  }

  private _validatePayoutInformation(info: SpeiPayoutInformation): void {
    if (!/^\d{18}$/.test(info.clabe)) {
      throw new BloqueConfigError(
        'depositInformation.clabe must be an 18-digit CLABE',
      );
    }
    if (info.beneficiaryName.trim().length < 2) {
      throw new BloqueConfigError(
        'depositInformation.beneficiaryName must be at least 2 characters',
      );
    }
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

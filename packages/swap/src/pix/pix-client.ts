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
  CreatePixDepositParams,
  CreatePixOrderOptions,
  CreatePixOrderParams,
  CreatePixOrderResult,
  PixDepositInformation,
  PixPayoutInformation,
} from './types';

/** PIX pay-ins (BRL → BRLB) and payouts (BRLB → BRL). */
export class PixClient extends BaseClient {
  async createDeposit(
    params: CreatePixDepositParams,
    options?: CreatePixOrderOptions,
  ): Promise<CreatePixOrderResult> {
    this._validateOrderParams(params);
    this._validateDepositInformation(params.depositInformation);
    return this._create(
      params,
      {
        urn: params.depositInformation.urn.trim(),
        payer_name: params.depositInformation.payerName.trim(),
        payer_document_number:
          params.depositInformation.payerDocumentNumber.trim(),
        ...(params.depositInformation.payerDocumentType
          ? {
              payer_document_type: params.depositInformation.payerDocumentType,
            }
          : {}),
      },
      'pix',
      'kusama',
      options,
    );
  }

  async create(
    params: CreatePixOrderParams,
    options?: CreatePixOrderOptions,
  ): Promise<CreatePixOrderResult> {
    this._validateOrderParams(params);
    this._validatePayoutInformation(params.depositInformation);
    return this._create(
      params,
      {
        pix_key_type: params.depositInformation.pixKeyType,
        pix_key_value: params.depositInformation.pixKeyValue.trim(),
        ...(params.depositInformation.beneficiaryName?.trim()
          ? {
              beneficiary_name:
                params.depositInformation.beneficiaryName.trim(),
            }
          : {}),
      },
      'kusama',
      'pix',
      options,
    );
  }

  private async _create(
    params: CreatePixDepositParams | CreatePixOrderParams,
    depositInformation: CreateOrderInput['deposit_information'],
    fromMedium: 'pix' | 'kusama',
    toMedium: 'kusama' | 'pix',
    options?: CreatePixOrderOptions,
  ): Promise<CreatePixOrderResult> {
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
    params: CreatePixDepositParams | CreatePixOrderParams | null | undefined,
  ): void {
    if (!params || typeof params !== 'object') {
      throw new BloqueConfigError('order params are required');
    }
    if (typeof params.rateSig !== 'string' || !params.rateSig.trim()) {
      throw new BloqueConfigError('rateSig is required');
    }
    const type = params.type ?? 'src';
    if (type !== 'src' && type !== 'dst') {
      throw new BloqueConfigError('type must be "src" or "dst"');
    }
    const amount = type === 'src' ? params.amountSrc : params.amountDst;
    if (
      typeof amount !== 'string' ||
      !/^\d+$/.test(amount) ||
      BigInt(amount) <= 0n
    ) {
      throw new BloqueConfigError(
        type === 'src'
          ? 'amountSrc must be a positive integer string when type is "src"'
          : 'amountDst must be a positive integer string when type is "dst"',
      );
    }
  }

  private _validateDepositInformation(
    info: PixDepositInformation | null | undefined,
  ): void {
    if (!info || typeof info !== 'object') {
      throw new BloqueConfigError('depositInformation is required');
    }
    if (typeof info.urn !== 'string' || !info.urn.trim())
      throw new BloqueConfigError('depositInformation.urn is required');
    if (
      typeof info.payerName !== 'string' ||
      info.payerName.trim().length < 2
    ) {
      throw new BloqueConfigError(
        'depositInformation.payerName must be at least 2 characters',
      );
    }
    if (
      typeof info.payerDocumentNumber !== 'string' ||
      !info.payerDocumentNumber.trim()
    ) {
      throw new BloqueConfigError(
        'depositInformation.payerDocumentNumber is required',
      );
    }
    if (
      info.payerDocumentType !== undefined &&
      info.payerDocumentType !== 'CPF' &&
      info.payerDocumentType !== 'CNPJ'
    ) {
      throw new BloqueConfigError(
        'depositInformation.payerDocumentType must be CPF or CNPJ',
      );
    }
  }

  private _validatePayoutInformation(
    info: PixPayoutInformation | null | undefined,
  ): void {
    if (!info || typeof info !== 'object') {
      throw new BloqueConfigError('depositInformation is required');
    }
    if (!['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'].includes(info.pixKeyType)) {
      throw new BloqueConfigError(
        'depositInformation.pixKeyType must be CPF, CNPJ, EMAIL, PHONE, or EVP',
      );
    }
    if (typeof info.pixKeyValue !== 'string' || !info.pixKeyValue.trim()) {
      throw new BloqueConfigError('depositInformation.pixKeyValue is required');
    }
    if (
      info.beneficiaryName !== undefined &&
      (typeof info.beneficiaryName !== 'string' ||
        info.beneficiaryName.trim().length < 2)
    ) {
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

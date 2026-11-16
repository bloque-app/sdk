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
  WithdrawToOperatorOptions,
  WithdrawToOperatorParams,
  WithdrawToOperatorResult,
} from './types';

const POLYGON_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = /^0x0{40}$/;
const MINOR_UNITS = /^[1-9][0-9]*$/;

function checkWalletAddress(value: string | undefined, field: string): string {
  const address = value?.trim();
  if (
    !address ||
    !POLYGON_ADDRESS.test(address) ||
    ZERO_ADDRESS.test(address)
  ) {
    throw new BloqueConfigError(
      `${field} must be a Polygon address: 0x followed by 40 hex characters, and not the zero address`,
    );
  }
  return address;
}

interface WithdrawalResponse {
  withdrawal_op: string;
  account_urn: string;
  amount: string;
  asset: string;
  status: 'pending' | 'settled';
}

/**
 * Polygon client: withdraw a USDC balance to a Polygon address.
 */
export class PolygonClient extends BaseClient {
  /**
   * Step 1 of a Polygon USDC withdrawal: move `amount` of your USDC balance
   * from one of your accounts to the operator account, approved once with
   * your passkey. The approval covers the account, the amount and the
   * Polygon address the order will pay.
   *
   * The first call throws `BloqueApprovalRequiredError` with an
   * `approvalUrl`. Wrap the call in `withApproval` to wait for the approval
   * and repeat it once. Then pass the returned `withdrawalOp` to
   * `polygon.create` with the same account, amount and address: that order
   * needs no second approval.
   *
   * @throws {BloqueConfigError} If an argument is invalid or there is no session
   *
   * @example
   * ```typescript
   * const withdrawal = await withApproval(
   *   (approval) =>
   *     bloque.swap.polygon.withdraw(
   *       { sourceAccountUrn, amount: '1000000', walletAddress: '0x…' },
   *       { approval },
   *     ),
   *   { onApprovalRequired: (e) => console.log('Approve:', e.approvalUrl) },
   * );
   * ```
   */
  async withdraw(
    params: WithdrawToOperatorParams,
    options?: WithdrawToOperatorOptions,
  ): Promise<WithdrawToOperatorResult> {
    if (!this.httpClient.urn) {
      throw new BloqueConfigError(
        'User URN is not available. Please connect to a session first.',
      );
    }
    const sourceAccountUrn = params.sourceAccountUrn?.trim();
    if (!sourceAccountUrn) {
      throw new BloqueConfigError('sourceAccountUrn is required');
    }
    const amount = params.amount?.trim();
    if (!amount || !MINOR_UNITS.test(amount)) {
      throw new BloqueConfigError(
        'amount must be a positive integer string in 6-decimal units',
      );
    }
    const walletAddress = checkWalletAddress(
      params.walletAddress,
      'walletAddress',
    );

    const response = await this.httpClient.request<WithdrawalResponse>({
      method: 'POST',
      path: '/api/swap/busdc/holder-withdrawals',
      body: {
        account_urn: sourceAccountUrn,
        amount,
        wallet_address: walletAddress,
      },
      headers: operationApprovalHeaders(options),
    });

    return {
      withdrawalOp: response.withdrawal_op,
      sourceAccountUrn: response.account_urn,
      amount: response.amount,
      asset: response.asset,
      status: response.status,
    };
  }

  /**
   * Step 2 of a Polygon USDC withdrawal: create the order (`kusama` →
   * `polygon`, `BUSDC/6` → `USDC/6`) with the `withdrawalOp` from
   * `polygon.withdraw`.
   *
   * When the order matches that withdrawal (same account, amount and
   * Polygon address, within 24 hours, not used before), it needs no second
   * approval. Otherwise the first call throws `BloqueApprovalRequiredError`
   * with an `approvalUrl`; wrapping it in `withApproval` covers both cases.
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
   *         args: {
   *           sourceAccountUrn: 'did:bloque:account:virtual:…',
   *           // From polygon.withdraw, with the same amount and address
   *           withdrawalOp: withdrawal.withdrawalOp,
   *         },
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

    const walletAddress = checkWalletAddress(
      params.depositInformation?.walletAddress,
      'depositInformation.walletAddress',
    );

    const sourceAccountUrn = params.args?.sourceAccountUrn?.trim();
    if (!sourceAccountUrn) {
      throw new BloqueConfigError('args.sourceAccountUrn is required');
    }

    const withdrawalOp = params.args?.withdrawalOp?.trim();
    if (!withdrawalOp) {
      throw new BloqueConfigError(
        'args.withdrawalOp is required: the operation reference of your withdrawal to the operator account',
      );
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
      args: { account_urn: sourceAccountUrn, withdrawal_op: withdrawalOp },
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

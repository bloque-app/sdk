import type { ExecutionHow as PublicExecutionHow } from '../bank-transfer/types';
import type {
  ExecutionHow as WireExecutionHow,
  ExecutionHowBrebDeposit as WireExecutionHowBrebDeposit,
  ExecutionHowCallback as WireExecutionHowCallback,
  ExecutionHowIframe as WireExecutionHowIframe,
} from './wire-types';

function isWireBrebDepositHow(
  how: WireExecutionHow,
): how is WireExecutionHowBrebDeposit {
  return how.type === 'BREB_DEPOSIT';
}

// `ExecutionHowRedirect.type` is a plain `string`, not a literal, so a
// discriminant check via `how.type === 'CALLBACK'` can't narrow it away —
// checking for the shape-specific field instead.
function isWireCallbackHow(
  how: WireExecutionHow,
): how is WireExecutionHowCallback {
  return how.type === 'CALLBACK' && 'args' in how;
}

function isWireIframeHow(how: WireExecutionHow): how is WireExecutionHowIframe {
  return how.type === 'IFRAME' && 'iframe' in how;
}

/**
 * Maps API execution `how` payload to SDK camelCase discriminated union.
 * @internal
 */
export function mapExecutionHow(how: WireExecutionHow): PublicExecutionHow {
  if (isWireBrebDepositHow(how)) {
    return {
      type: 'BREB_DEPOSIT',
      medium: how.medium,
      keyType: how.key_type,
      keyValue: how.key_value,
      amount: how.amount,
      currency: how.currency,
      reference: how.reference,
      depositAccountUrn: how.deposit_account_urn,
      expectedAmount: how.expected_amount,
      receivedAmount: how.received_amount,
      remainingAmount: how.remaining_amount,
      depositStatus: how.deposit_status,
    };
  }

  if (isWireCallbackHow(how)) {
    return { type: 'CALLBACK', args: how.args };
  }

  if (isWireIframeHow(how)) {
    return { type: 'IFRAME', iframe: how.iframe };
  }

  return {
    type: how.type,
    url: how.url ?? '',
  };
}

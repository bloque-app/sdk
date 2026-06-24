import type { ExecutionHow as PublicExecutionHow } from '../bank-transfer/types';
import type {
  ExecutionHow as WireExecutionHow,
  ExecutionHowBrebDeposit as WireExecutionHowBrebDeposit,
} from './wire-types';

function isWireBrebDepositHow(
  how: WireExecutionHow,
): how is WireExecutionHowBrebDeposit {
  return how.type === 'BREB_DEPOSIT';
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

  return {
    type: how.type,
    url: how.url ?? '',
  };
}

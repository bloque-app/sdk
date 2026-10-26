import { SDK, withApproval } from '../../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect(process.env.USER_HANDLE ?? 'demo-user');

const sourceAccountUrn =
  process.env.SOURCE_ACCOUNT_URN ?? 'did:bloque:account:breb:demo-account-id';
const amountSrc = process.env.AMOUNT_SRC ?? '10000000';

const rates = await user.swap.findRates({
  fromAsset: 'COPM/2',
  toAsset: 'COP/2',
  fromMediums: ['kusama'],
  toMediums: ['breb'],
  amountSrc,
});
console.log('Swap rates result:', rates);

if (rates.rates.length === 0) {
  throw new Error(
    'No swap rates available for the specified assets and mediums.',
  );
}

// If the account owner must approve this with their passkey, withApproval
// shares the link, waits for the approval and repeats the call once.
const result = await withApproval(
  (approval) =>
    user.swap.breb.create(
      {
        rateSig: rates.rates[0]!.sig,
        amountSrc,
        depositInformation: {
          // Any unique string -- required, not used by the active provider.
          resolutionId: `payout-${crypto.randomUUID()}`,
          // keyType is optional; only the key value is required.
          destinationKey: {
            keyValue: '@JAR1234',
          },
        },
        args: {
          // Your own account -- funds the payout, not the recipient.
          sourceAccountUrn,
        },
      },
      { idempotencyKey: 'f7a3b89e-6d3f-4e9e-8b7f-a1c4d2e5f901', approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);

console.log('BREB payment created:', {
  requestId: result.requestId,
  orderId: result.order.id,
  status: result.order.status,
  execution: result.execution,
});

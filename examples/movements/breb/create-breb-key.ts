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

// If the account owner must approve this with their passkey, withApproval
// shares the link, waits for the approval and repeats the call once.
const { data, error } = await withApproval(
  (approval) =>
    user.accounts.breb.createKey(
      {
        keyType: 'PHONE',
        key: process.env.BREB_KEY ?? '3015550184',
        displayName: process.env.BREB_DISPLAY_NAME ?? 'Camila Ortega',
        metadata: {
          source: 'demo',
        },
      },
      { approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);

console.log('BREB create key response:', { data, error });

if (error || !data) {
  throw new Error(error?.message ?? 'Failed to create BRE-B key');
}

console.log('BREB key created:', {
  urn: data.urn,
  keyType: data.keyType,
  key: data.key,
  displayName: data.displayName,
  status: data.status,
  ledgerId: data.ledgerId,
});

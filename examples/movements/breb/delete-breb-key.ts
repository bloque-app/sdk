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

const accountUrn =
  process.env.BREB_ACCOUNT_URN ?? 'did:bloque:account:breb:demo-account-id';

// If the account owner must approve this with their passkey, withApproval
// shares the link, waits for the approval and repeats the call once.
const { data, error } = await withApproval(
  (approval) =>
    user.accounts.breb.deleteKey(
      {
        accountUrn,
      },
      { approval },
    ),
  {
    onApprovalRequired: (error) =>
      console.log('Approve with your passkey:', error.approvalUrl),
  },
);

console.log('BREB delete key response:', { data, error });

if (error || !data) {
  throw new Error(error?.message ?? 'Failed to delete BRE-B key');
}

console.log('BREB key deleted:', {
  deleted: data.deleted,
  accountUrn: data.accountUrn,
  keyId: data.keyId,
  status: data.status,
});

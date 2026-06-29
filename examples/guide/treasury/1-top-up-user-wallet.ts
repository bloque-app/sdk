import { SDK } from '../../../packages/sdk/src/index';

/**
 * Step 1 of the treasury guide.
 *
 * Transfer DUSD from the master treasury account to a user's card wallet.
 *
 * Prerequisites:
 * - Run 0-create-master-account.ts first
 * - MASTER_HANDLE, USER_HANDLE env vars (or defaults below)
 * - MASTER_ACCOUNT_URN and DESTINATION_CARD_URN from prior setup
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: (process.env.MODE as 'production' | 'sandbox') ?? 'sandbox',
  platform: 'node',
});

const masterHandle = process.env.MASTER_HANDLE ?? '@treasury-master';

const sessionMaster = await bloque.connect(masterHandle);

const destinationCardUrn =
  process.env.DESTINATION_CARD_URN ?? 'urn:bloque:account:card:usr-123:crd-456';
const masterAccountUrn =
  process.env.MASTER_ACCOUNT_URN ?? 'urn:bloque:polygon:0x1231231231';

await sessionMaster.accounts.transfer({
  amount: process.env.AMOUNT ?? '1000000000000',
  asset: 'DUSD/6',
  sourceUrn: masterAccountUrn,
  destinationUrn: destinationCardUrn,
  metadata: {
    type: 'top-up',
    purpose: 'user-wallet',
  },
});

console.log('Top-up transfer completed.');

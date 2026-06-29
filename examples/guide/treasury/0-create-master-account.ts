import { SDK } from '../../../packages/sdk/src/index';

/**
 * Step 0 of the treasury guide.
 *
 *   1. Register a business identity (the treasury master).
 *   2. Create a master Polygon account for project funds.
 *   3. Create a user deposit Polygon address on the same ledger.
 *
 * When users deposit funds into their deposit address, the balance
 * eventually settles to the master treasury account.
 *
 * Run step 1 (1-top-up-user-wallet.ts) to transfer funds from treasury to a user card.
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
const userHandle = process.env.USER_HANDLE ?? '@treasury-user';

const session = await bloque.register(masterHandle, {
  type: 'business',
  profile: {
    name: 'Treasury Master',
    legalName: 'Treasury Master LLC',
    taxId: '1234567890',
    incorporationDate: '2026-01-01',
    type: 'corporation',
    countryCode: 'US',
    state: 'CA',
    addressLine1: '123 Main St',
    postalCode: '10001',
    city: 'Anytown',
    country: 'USA',
    ownerName: 'Jane Doe',
    ownerIdType: 'SSN',
    ownerIdNumber: '1234567890',
    ownerAddressLine1: '123 Main St',
    ownerPostalCode: '10001',
    ownerCity: 'Anytown',
    ownerCountryCode: 'USA',
  },
});

const userA = await bloque.connect(userHandle);

const masterPolygon = await session.accounts.polygon.create({
  metadata: {
    type: 'treasury',
    purpose: 'project-funds',
  },
});

const userDepositPolygon = await userA.accounts.polygon.create({
  ledgerId: masterPolygon.ledgerId,
});

console.log('Master treasury polygon account:', masterPolygon.urn);
console.log('User deposit polygon account:', userDepositPolygon.urn);

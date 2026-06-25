import { SDK } from '../../../packages/sdk/src/index';

/**
 * Step 1 of the Polygon → RTP guide.
 *
 *   1. Register a new identity (individual).
 *   2. Create a Polygon address (on top of a virtual ledger).
 *
 * Run step 2 (do-rtp-payout.ts) afterwards to cash out via RTP.
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
  platform: 'node',
});

// 1. Register a new identity. register() returns an authenticated session,
//    just like connect().
const handle = process.env.USER_HANDLE ?? 'nestor-2';

const user = await bloque.register(handle, {
  type: 'individual',
  profile: {
    firstName: 'Nestor',
    lastName: 'Nestor',
    email: 'nestor@example.com',
    phone: '+1234567890',
    birthdate: '1990-01-01',
    city: 'Mexico City',
    state: 'Mexico',
    postalCode: '10001',
    countryOfBirthCode: 'MEX',
    countryOfResidenceCode: 'MEX',
  },
});

console.log('Identity registered:', user.urn);

// 2. Create a Polygon address. Polygon settles on a virtual ledger, so we
//    create the virtual account first and pass its ledgerId.
const virtual = await user.accounts.virtual.create(
  {},
  { waitLedger: true, idempotencyKey: `virtual-${handle}` },
);

const polygon = await user.accounts.polygon.create(
  { ledgerId: virtual.ledgerId },
  { waitLedger: true, idempotencyKey: `polygon-${handle}` },
);

console.log('Polygon address created:', polygon.urn);

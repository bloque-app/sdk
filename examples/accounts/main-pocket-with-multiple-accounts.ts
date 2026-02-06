import { SDK } from '../../packages/sdk';

const bloque = new SDK({
  origin: '{origin}',
  auth: {
    type: 'apiKey',
    apiKey: '{}',
  },
  mode: 'sandbox',
});

const session = await bloque.register('david', {
  type: 'individual',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    city: 'tunja',
    state: 'Boyacá',
    addressLine1: 'Calle 123',
    addressLine2: 'Apt 456',
    countryOfBirthCode: 'COL',
    countryOfResidenceCode: 'COL',
    postalCode: '150001',
    personalIdType: 'CC',
    personalIdNumber: '1234567890',
  },
});

console.log('access token', session.accessToken);
const card = await session.accounts.virtual.create({}, { waitLedger: true });

console.log(JSON.stringify(card, null, 2));

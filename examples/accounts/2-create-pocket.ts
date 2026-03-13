import { SDK } from '../../packages/sdk/src/index';

const bloque = new SDK({
  origin: 'bloque-root',
  auth: {
    type: 'apiKey',
    apiKey: `sk_dev_327dc8b78f293b8ec0cd3b7c8ce90c5acd71f4cde0200172f5f599e62e7a6240`,
  },
  // mode: 'sandbox',
  baseUrl: 'http://localhost:3000',
});

const user = await bloque.register('david', {
  type: 'individual',
  profile: {
    email: 'david@bloque.app',
    firstName: 'David',
    lastName: 'Doe',
    phone: '+573178901234',
    birthdate: '1990-01-01',
    countryOfBirthCode: 'USA',
    countryOfResidenceCode: 'USA',
    personalIdType: 'SSN',
    personalIdNumber: '1234567890',
  },
});

console.log(user.accessToken);

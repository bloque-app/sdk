import { SDK } from '../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
  },
  mode: 'sandbox',
  platform: 'node',
});

const user = await bloque.register('nestor', {
  type: 'individual',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    birthdate: '1990-01-01',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    gender: 'M',
    addressLine1: '123 Main Street',
    addressLine2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    countryOfBirthCode: 'USA',
    countryOfResidenceCode: 'USA',
    personalIdType: 'SSN',
    personalIdNumber: '123-45-6789',
  },
});

const accounts = await user.accounts.list();

console.log('User accounts:', accounts);

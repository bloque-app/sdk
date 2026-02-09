import { SDK } from '../../packages/sdk';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

await bloque.register('@nestor', {
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
    countryOfBirthCode: 'MX',
    countryOfResidenceCode: 'MX',
  },
});

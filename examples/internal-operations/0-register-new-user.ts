import { SDK } from '../../packages/sdk';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
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
  // Your server is registering on the user's behalf — forward their real IP
  // (e.g. from the incoming request's `X-Forwarded-For`) so Bloque resolves
  // their usage country and audits decisions against them, not your server.
  clientIp: '190.85.12.4',

  // Optional. Only send this when the client already has the user verified
  // in Sumsub from a previous integration — it lets Bloque link that
  // existing Sumsub applicant instead of starting a new verification.
  // Omit it entirely for a brand-new user with no prior Sumsub history.
  // extraContext: {
  //   sumsub_applicant_id: process.env.SUMSUB_APPLICANT_ID!,
  // },
});

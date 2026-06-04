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
    // Basic profile is supported: at least one of email or phone.
    email: 'nestor@example.com',
    firstName: 'Nestor',
  },
});

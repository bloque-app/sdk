import { SDK } from '../../packages/sdk';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: 'sandbox',
});

const session = await bloque.register('david', {
  type: 'individual',
  profile: {},
  extraContext: {
    sumsub_applicant_id: process.env.SUMSUB_APPLICANT_ID!,
  },
});

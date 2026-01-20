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

const user = await bloque.connect('nestor');

// 1. Create PSE top-up
const topUp = await user.swap.pse.createTopUp({
  amount: '50000000',
  currency: 'DUSD/6',
  successUrl: 'https://example.com/payment/success',
  webhookUrl: 'https://myapp.com/webhooks/payment',
});
console.log('PSE Top-Up created:', topUp);

// 2. Initiate PSE payment
const result = await user.swap.pse.initiatePayment({
  paymentUrn: topUp.payment.urn,
  payee: {
    name: 'Juan Pérez García',
    email: 'juan.perez@example.com',
    idType: 'CC',
    idNumber: '1055228746',
  },
  personType: 'natural',
  bankCode: '1',
});

console.log('PSE Payment initiated:', result.checkoutUrl);

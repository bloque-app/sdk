type PixKeyType = 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'EVP';

const activationUrl = 'https://calendly.com/hi-bloque/15-min';

const request = {
  rail: 'pix',
  activationUrl,
  country: 'BRA',
  useCase: 'receive',
  requestedKeyTypes: [
    'CPF',
    'CNPJ',
    'PHONE',
    'EMAIL',
    'EVP',
  ] satisfies PixKeyType[],
  sampleKey: {
    type: 'PHONE' satisfies PixKeyType,
    value: '+5511999999999',
  },
  webhookUrl: 'https://api.example.com/webhooks/pix',
};

console.log('PIX activation request:', request);
console.log('Schedule activation:', activationUrl);

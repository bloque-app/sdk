type SpeiIdentifierType = 'CLABE' | 'DEBIT_CARD' | 'MOBILE';

const activationUrl = 'https://calendly.com/hi-bloque/15-min';

const request = {
  rail: 'spei',
  activationUrl,
  country: 'MEX',
  useCase: 'receive',
  requestedIdentifierTypes: ['CLABE'] satisfies SpeiIdentifierType[],
  sampleIdentifier: {
    type: 'CLABE' satisfies SpeiIdentifierType,
    value: '002010077777777771',
  },
  webhookUrl: 'https://api.example.com/webhooks/spei',
};

console.log('SPEI activation request:', request);
console.log('Schedule activation:', activationUrl);

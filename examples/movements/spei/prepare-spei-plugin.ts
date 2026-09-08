type SpeiIdentifierType = 'CLABE' | 'DEBIT_CARD' | 'MOBILE';

interface SpeiActivationRequest {
  rail: 'spei';
  activationUrl: string;
  country: 'MEX';
  useCase: 'receive' | 'payout' | 'reconciliation' | 'treasury';
  requestedIdentifierTypes: SpeiIdentifierType[];
  sampleIdentifier?: {
    type: SpeiIdentifierType;
    value: string;
  };
  webhookUrl?: string;
  notes?: string;
}

const activationUrl = 'https://calendly.com/hi-bloque/15-min';

function parseSpeiIdentifierTypes(
  value: string | undefined,
): SpeiIdentifierType[] {
  if (!value) {
    return ['CLABE'];
  }

  return value.split(',').map((identifierType) => {
    const normalized = identifierType.trim().toUpperCase();

    if (
      normalized !== 'CLABE' &&
      normalized !== 'DEBIT_CARD' &&
      normalized !== 'MOBILE'
    ) {
      throw new Error(`Unsupported SPEI identifier type: ${identifierType}`);
    }

    return normalized;
  });
}

function isValidClabe(value: string): boolean {
  if (!/^\d{18}$/.test(value)) {
    return false;
  }

  const weights = [3, 7, 1];
  const sum = value
    .slice(0, 17)
    .split('')
    .reduce((total, digit, index) => {
      const product = Number(digit) * weights[index % weights.length];
      return total + (product % 10);
    }, 0);

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(value[17]);
}

function validateSpeiIdentifier(
  type: SpeiIdentifierType,
  value: string,
): boolean {
  switch (type) {
    case 'CLABE':
      return isValidClabe(value);
    case 'DEBIT_CARD':
      return /^\d{16}$/.test(value);
    case 'MOBILE':
      return /^\d{10}$/.test(value);
  }
}

const sampleIdentifierType =
  (process.env.SPEI_IDENTIFIER_TYPE as SpeiIdentifierType) ?? 'CLABE';
const sampleIdentifierValue =
  process.env.SPEI_IDENTIFIER ?? '002010077777777771';

if (!validateSpeiIdentifier(sampleIdentifierType, sampleIdentifierValue)) {
  throw new Error(
    `Invalid sample SPEI ${sampleIdentifierType} identifier: ${sampleIdentifierValue}`,
  );
}

const request: SpeiActivationRequest = {
  rail: 'spei',
  activationUrl,
  country: 'MEX',
  useCase:
    (process.env.SPEI_USE_CASE as SpeiActivationRequest['useCase']) ??
    'receive',
  requestedIdentifierTypes: parseSpeiIdentifierTypes(
    process.env.SPEI_IDENTIFIER_TYPES,
  ),
  sampleIdentifier: {
    type: sampleIdentifierType,
    value: sampleIdentifierValue,
  },
  webhookUrl: process.env.SPEI_WEBHOOK_URL,
  notes:
    process.env.SPEI_NOTES ??
    'SPEI account plugin activation is sales-gated. Share this payload during onboarding.',
};

console.log('SPEI activation request:', request);
console.log('Schedule activation:', activationUrl);

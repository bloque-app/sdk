type PixKeyType = 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'EVP';

interface PixActivationRequest {
  rail: 'pix';
  activationUrl: string;
  country: 'BRA';
  useCase: 'receive' | 'payout' | 'qr_collection' | 'reconciliation';
  requestedKeyTypes: PixKeyType[];
  sampleKey?: {
    type: PixKeyType;
    value: string;
  };
  webhookUrl?: string;
  notes?: string;
}

const activationUrl = 'https://calendly.com/hi-bloque/15-min';

function parsePixKeyTypes(value: string | undefined): PixKeyType[] {
  if (!value) {
    return ['CPF', 'CNPJ', 'PHONE', 'EMAIL', 'EVP'];
  }

  return value.split(',').map((keyType) => {
    const normalized = keyType.trim().toUpperCase();

    if (
      normalized !== 'CPF' &&
      normalized !== 'CNPJ' &&
      normalized !== 'PHONE' &&
      normalized !== 'EMAIL' &&
      normalized !== 'EVP'
    ) {
      throw new Error(`Unsupported PIX key type: ${keyType}`);
    }

    return normalized;
  });
}

function validatePixKey(type: PixKeyType, value: string): boolean {
  switch (type) {
    case 'CPF':
      return /^\d{11}$/.test(value);
    case 'CNPJ':
      return /^\d{14}$/.test(value);
    case 'PHONE':
      return /^\+[1-9]\d{7,14}$/.test(value);
    case 'EMAIL':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'EVP':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      );
  }
}

const sampleKeyType = (process.env.PIX_KEY_TYPE as PixKeyType) ?? 'PHONE';
const sampleKeyValue = process.env.PIX_KEY ?? '+5511999999999';

if (!validatePixKey(sampleKeyType, sampleKeyValue)) {
  throw new Error(`Invalid sample PIX ${sampleKeyType} key: ${sampleKeyValue}`);
}

const request: PixActivationRequest = {
  rail: 'pix',
  activationUrl,
  country: 'BRA',
  useCase:
    (process.env.PIX_USE_CASE as PixActivationRequest['useCase']) ??
    'receive',
  requestedKeyTypes: parsePixKeyTypes(process.env.PIX_KEY_TYPES),
  sampleKey: {
    type: sampleKeyType,
    value: sampleKeyValue,
  },
  webhookUrl: process.env.PIX_WEBHOOK_URL,
  notes:
    process.env.PIX_NOTES ??
    'PIX account plugin activation is sales-gated. Share this payload during onboarding.',
};

console.log('PIX activation request:', request);
console.log('Schedule activation:', activationUrl);

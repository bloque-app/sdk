const ASSET_MAP: Record<string, { asset: string; decimals: number }> = {
  USD: { asset: 'DUSD/6', decimals: 6 },
  COP: { asset: 'COP/2', decimals: 2 },
};

const REVERSE_ASSET_MAP: Record<string, { currency: string; decimals: number }> = {
  'DUSD/6': { currency: 'USD', decimals: 6 },
  'COP/2': { currency: 'COP', decimals: 2 },
  'COPB/6': { currency: 'COP', decimals: 6 },
  'KSM/12': { currency: 'KSM', decimals: 12 },
};

export function toRaw(
  humanAmount: string,
  currency: string,
): { amount: string; asset: string } {
  const mapping = ASSET_MAP[currency.toUpperCase()];
  if (!mapping) {
    return { amount: humanAmount, asset: currency };
  }
  const parts = humanAmount.split('.');
  const integerPart = parts[0] ?? '0';
  const fractionalPart = (parts[1] ?? '')
    .padEnd(mapping.decimals, '0')
    .slice(0, mapping.decimals);
  const raw =
    BigInt(integerPart) * BigInt(10 ** mapping.decimals) +
    BigInt(fractionalPart);
  return { amount: raw.toString(), asset: mapping.asset };
}

export function toHuman(
  rawAmount: string,
  asset: string,
): { amount: string; currency: string } {
  const mapping = REVERSE_ASSET_MAP[asset];
  if (!mapping) {
    return { amount: rawAmount, currency: asset };
  }
  const raw = BigInt(rawAmount);
  const divisor = BigInt(10 ** mapping.decimals);
  const integerPart = raw / divisor;
  const fractionalPart = raw % divisor;
  const fracStr = fractionalPart
    .toString()
    .padStart(mapping.decimals, '0')
    .replace(/0+$/, '');
  const humanAmount = fracStr
    ? `${integerPart}.${fracStr}`
    : integerPart.toString();
  return { amount: humanAmount, currency: mapping.currency };
}

export function humanizeBalance(
  balance: Record<string, { current: string; pending: string; in?: string; out?: string }>,
) {
  return Object.entries(balance).map(([asset, values]) => {
    const { currency } = toHuman('0', asset);
    return {
      currency,
      current: toHuman(values.current, asset).amount,
      pending: toHuman(values.pending, asset).amount,
      ...(values.in != null ? { in: toHuman(values.in, asset).amount } : {}),
      ...(values.out != null ? { out: toHuman(values.out, asset).amount } : {}),
    };
  });
}

export function resolveAsset(currency: string): string {
  return ASSET_MAP[currency.toUpperCase()]?.asset ?? currency;
}

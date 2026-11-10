import type { FeeComponent, RateQuote, RateQuoteFee, SwapRate } from './types';

type Rational = { n: bigint; d: bigint };

const ZERO: Rational = { n: 0n, d: 1n };

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x || 1n;
}

function rational(n: bigint, d = 1n): Rational {
  if (d === 0n) throw new Error('Division by zero in rate formula');
  const sign = d < 0n ? -1n : 1n;
  const g = gcd(n, d);
  return { n: (n / g) * sign, d: (d < 0n ? -d : d) / g };
}

const add = (a: Rational, b: Rational) =>
  rational(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Rational, b: Rational) =>
  rational(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Rational, b: Rational) => rational(a.n * b.n, a.d * b.d);
const div = (a: Rational, b: Rational) => rational(a.n * b.d, a.d * b.n);

function parseRational(value: number | string): Rational {
  const text = String(value).trim();
  const fraction = /^([+-]?\d+)\/([+-]?\d+)$/.exec(text);
  if (fraction) return rational(BigInt(fraction[1]), BigInt(fraction[2]));
  const decimal = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!decimal || (decimal[2] === '' && !decimal[3])) {
    throw new Error(`Invalid number in rate fee: ${text}`);
  }
  const fractionDigits = decimal[3] ?? '';
  const exponent = Number(decimal[4] ?? '0') - fractionDigits.length;
  const digits =
    BigInt(`${decimal[2] || '0'}${fractionDigits}`) *
    (decimal[1] === '-' ? -1n : 1n);
  return exponent >= 0
    ? rational(digits * 10n ** BigInt(exponent))
    : rational(digits, 10n ** BigInt(-exponent));
}

function tokenize(formula: string): string[] {
  const tokens: string[] = [];
  const pattern =
    /\s*(?:(\d+(?:\.\d*)?|\.\d+)|([A-Za-z_][A-Za-z0-9_]*)|([()+\-*/]))/y;
  while (pattern.lastIndex < formula.length) {
    const start = pattern.lastIndex;
    const match = pattern.exec(formula);
    if (!match) {
      if (/^\s*$/.test(formula.slice(start))) break;
      throw new Error(`Invalid rate formula token at offset ${start}`);
    }
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

function evaluate(formula: string, variables: Map<string, Rational>): Rational {
  const tokens = tokenize(formula);
  let i = 0;
  const expression = (): Rational => {
    let value = term();
    while (tokens[i] === '+' || tokens[i] === '-') {
      const op = tokens[i++];
      const right = term();
      value = op === '+' ? add(value, right) : sub(value, right);
    }
    return value;
  };
  const term = (): Rational => {
    let value = factor();
    while (tokens[i] === '*' || tokens[i] === '/') {
      const op = tokens[i++];
      const right = factor();
      value = op === '*' ? mul(value, right) : div(value, right);
    }
    return value;
  };
  const factor = (): Rational => {
    const token = tokens[i++];
    if (token === undefined) throw new Error('Unexpected end of rate formula');
    if (token === '+') return factor();
    if (token === '-') return sub(ZERO, factor());
    if (token === '(') {
      const value = expression();
      if (tokens[i++] !== ')') throw new Error('Missing ) in rate formula');
      return value;
    }
    if (/^[\d.]/.test(token)) return parseRational(token);
    const value = variables.get(token);
    if (value === undefined) {
      throw new Error(`Unknown variable in rate formula: ${token}`);
    }
    return value;
  };
  const result = expression();
  if (i !== tokens.length) throw new Error('Invalid rate formula');
  return result;
}

function precisionOf(asset: string): number {
  const precision = Number(asset.split('/')[1]);
  if (!Number.isInteger(precision) || precision < 0) {
    throw new Error(`Asset must include its precision, e.g. MXN/2: ${asset}`);
  }
  return precision;
}

/** Rounds down to atoms, like the server does. */
function toAtoms(value: Rational, precision: number): bigint {
  const scaled = value.n * 10n ** BigInt(precision);
  const atoms = scaled / value.d;
  return scaled < 0n && atoms * value.d !== scaled ? atoms - 1n : atoms;
}

function isFee(component: FeeComponent): component is FeeComponent & {
  type: 'percentage' | 'fixed';
} {
  return component.type === 'percentage' || component.type === 'fixed';
}

/**
 * Calculates what a rate delivers for a specific source amount, with the
 * same exact arithmetic and rounding the server applies at take.
 *
 * `rate.ratio` and `rate.rate` are only valid for the reference amount when
 * the fee has a fixed component (e.g. SPEI's 5 MXN), so use this to show a
 * quote for the amount the user typed.
 *
 * @param rate - A rate from `findRates()`
 * @param amountSrc - Source amount in atoms (e.g. `"100000"` = 1,000.00 MXN)
 *
 * @example
 * ```typescript
 * const { rates } = await bloque.swap.findRates({ ... });
 * const quote = calculateRateQuote(rates[0], '100000');
 * // SPEI 2% + 5 MXN: quote.amountDst === '97500', quote.fee === '2500'
 * ```
 */
export function calculateRateQuote(
  rate: Pick<SwapRate, 'edge' | 'fee'>,
  amountSrc: string,
): RateQuote {
  if (!/^\d+$/.test(amountSrc)) {
    throw new Error('amountSrc must be a non-negative integer of atoms');
  }
  const [fromAsset, toAsset] = rate.edge;
  const sourcePrecision = precisionOf(fromAsset);
  const destinationPrecision = precisionOf(toAsset);
  const { formula, components } = rate.fee;

  const variables = new Map<string, Rational>([
    ['amount_src', rational(BigInt(amountSrc), 10n ** BigInt(sourcePrecision))],
  ]);
  for (const component of components) {
    variables.set(component.name, parseRational(component.value));
  }
  const withZero = (names: string[]) => {
    const neutral = new Map(variables);
    for (const name of names) neutral.set(name, ZERO);
    return evaluate(formula, neutral);
  };

  const actual = evaluate(formula, variables);
  if (actual.n < 0n) {
    throw new Error('Amount is too small for this rate: fees exceed it');
  }
  const feeComponents = components.filter(isFee);
  const beforeFees = withZero(feeComponents.map((c) => c.name));
  const amountDst = toAtoms(actual, destinationPrecision);
  const amountBeforeFees = toAtoms(beforeFees, destinationPrecision);

  const fees: RateQuoteFee[] = feeComponents.map((component) => ({
    name: component.name,
    type: component.type,
    ...(component.role ? { role: component.role } : {}),
    ...(component.type === 'percentage' && component.percentage !== undefined
      ? { percentage: String(component.percentage) }
      : {}),
    ...(component.type === 'fixed' && component.amount !== undefined
      ? { fixedAmount: String(component.amount) }
      : {}),
    amount: toAtoms(
      sub(withZero([component.name]), actual),
      destinationPrecision,
    ).toString(),
  }));

  return {
    fromAsset,
    toAsset,
    currency: toAsset.split('/')[0],
    amountSrc,
    amountDst: amountDst.toString(),
    amountBeforeFees: amountBeforeFees.toString(),
    fee: (amountBeforeFees - amountDst).toString(),
    fees,
  };
}

import { describe, expect, it } from 'bun:test';
import { calculateRateQuote } from '../src/quote';
import type { Fee } from '../src/types';

const speiFee: Fee = {
  at: 1794344209097,
  value: '97995',
  formula: 'amount_src * (1 - provider_pct - bloque_pct) - provider_fixed',
  components: [
    {
      at: 0,
      name: 'provider_pct',
      type: 'percentage',
      value: '1/400',
      percentage: '0.25',
    },
    { at: 0, name: 'provider_fixed', type: 'fixed', value: '5', amount: '5' },
    {
      at: 0,
      name: 'bloque_pct',
      type: 'percentage',
      value: '7/400',
      percentage: '1.75',
      role: 'bloque_fee',
    },
  ],
};

const speiPayin = {
  edge: ['MXN/2', 'MXNB/2'] as [string, string],
  fee: speiFee,
};

describe('calculateRateQuote', () => {
  it('SPEI 1,000 MXN: 2% + 5 MXN', () => {
    const quote = calculateRateQuote(speiPayin, '100000');

    expect(quote).toEqual({
      fromAsset: 'MXN/2',
      toAsset: 'MXNB/2',
      currency: 'MXNB',
      amountSrc: '100000',
      amountDst: '97500',
      amountBeforeFees: '100000',
      fee: '2500',
      fees: [
        {
          name: 'provider_pct',
          type: 'percentage',
          percentage: '0.25',
          amount: '250',
        },
        {
          name: 'provider_fixed',
          type: 'fixed',
          fixedAmount: '5',
          amount: '500',
        },
        {
          name: 'bloque_pct',
          type: 'percentage',
          role: 'bloque_fee',
          percentage: '1.75',
          amount: '1750',
        },
      ],
    });
  });

  it('matches the server limits at the 100 and 100,000 MXN bounds', () => {
    expect(calculateRateQuote(speiPayin, '10000').amountDst).toBe('9300');
    expect(calculateRateQuote(speiPayin, '10000000').amountDst).toBe('9799500');
  });

  it('rounds down to destination atoms', () => {
    // 123.45 MXN → 120.981 - 5 = 115.981 → 115.98
    const quote = calculateRateQuote(speiPayin, '12345');
    expect(quote.amountDst).toBe('11598');
    expect(quote.fee).toBe('747');
  });

  it('differs from ratio × amount when there is a fixed fee', () => {
    // ratio at the reference amount is 0.97995; 1,000 MXN × ratio = 979.95
    expect(calculateRateQuote(speiPayin, '100000').amountDst).not.toBe('97995');
  });

  it('keeps an exchange rate out of the fee and converts precision', () => {
    const quote = calculateRateQuote(
      {
        edge: ['COP/2', 'DUSD/6'],
        fee: {
          at: 0,
          value: '0',
          formula: 'amount_src * usdcop * (1 - take)',
          components: [
            {
              at: 0,
              name: 'usdcop',
              type: 'rate',
              value: '1/4000',
              pair: 'USDCOP',
            },
            {
              at: 0,
              name: 'take',
              type: 'percentage',
              value: '0.01',
              percentage: '1',
            },
          ],
        },
      },
      '40000000', // 400,000.00 COP
    );
    expect(quote.amountBeforeFees).toBe('100000000'); // 100 DUSD
    expect(quote.amountDst).toBe('99000000');
    expect(quote.fee).toBe('1000000');
    expect(quote.currency).toBe('DUSD');
    expect(quote.fees).toHaveLength(1);
  });

  it('rejects amounts the fees exceed', () => {
    expect(() => calculateRateQuote(speiPayin, '100')).toThrow(
      'fees exceed it',
    );
  });

  it('rejects non-atom amounts', () => {
    expect(() => calculateRateQuote(speiPayin, '10.5')).toThrow(
      'non-negative integer',
    );
  });

  it('rejects unknown formula variables', () => {
    expect(() =>
      calculateRateQuote(
        { ...speiPayin, fee: { ...speiFee, formula: 'amount_src * nope' } },
        '100000',
      ),
    ).toThrow('Unknown variable');
  });
});

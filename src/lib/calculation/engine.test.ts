import { describe, expect, it } from 'vitest';

import {
  applyScientificFunction,
  cosDecimal,
  expDecimal,
  log10Decimal,
  lnDecimal,
  powerDecimal,
  rootDecimal,
  sinDecimal,
  sqrtDecimal,
} from './scientific';
import { evaluateExpression } from './expression';
import {
  addDecimals,
  createDecimal,
  decimalToString,
  divideDecimals,
  multiplyDecimals,
} from '../decimal';
import type { DecimalResult, DecimalValue } from '../decimal';

function decimal(input: string | number): DecimalValue {
  const result = createDecimal(input);

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function expectEvaluation(expression: string, expected: string): void {
  const result = evaluateExpression(expression);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(decimalToString(result.value)).toBe(expected);
  }
}

function expectEvaluationError(expression: string, code: string): void {
  const result = evaluateExpression(expression);

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe(code);
  }
}

function expectDecimalResult(result: DecimalResult, expected: string): void {
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(decimalToString(result.value)).toBe(expected);
  }
}

function expectScientificValue(
  result: ReturnType<typeof sinDecimal>,
  expected: number,
  precision = 12,
): void {
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.toNumber()).toBeCloseTo(expected, precision);
  }
}

function expectScientificString(result: ReturnType<typeof sqrtDecimal>, expected: string): void {
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(decimalToString(result.value)).toBe(expected);
  }
}

function expectScientificError(result: ReturnType<typeof sqrtDecimal>, code: string): void {
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe(code);
  }
}

describe('calculation expression engine', () => {
  it('applies operator precedence before addition and subtraction', () => {
    expectEvaluation('2 + 3 * 4', '14');
    expectEvaluation('20 - 8 / 4', '18');
  });

  it('evaluates nested parenthesized expressions', () => {
    expectEvaluation('(2 + 3) * 4', '20');
    expectEvaluation('((1 + 2) * (3 + 4)) / (5 - 2)', '7');
  });

  it('supports unary operators and calculator operator glyphs', () => {
    expectEvaluation('-(2 + 3) * 4', '-20');
    expectEvaluation('8 ÷ 4 + 3 × 2', '8');
    expectEvaluation('+5 + -2', '3');
  });

  it('parses exponent-form numeric literals', () => {
    expectEvaluation('1e3 + 2.5e-1', '1000.25');
  });

  it('reports parser and arithmetic errors without throwing', () => {
    expectEvaluationError('4 / 0', 'divide-by-zero');
    expectEvaluationError('(1 + 2', 'unclosed-parenthesis');
    expectEvaluationError('2 $ 3', 'invalid-token');
    expectEvaluationError('1e10000000000000000', 'invalid-number');
  });
});

describe('precision-safe decimal arithmetic', () => {
  it('avoids binary floating point drift for decimal addition', () => {
    expectEvaluation('0.1 + 0.2', '0.3');
  });

  it('preserves precision at large decimal boundaries', () => {
    expectDecimalResult(
      addDecimals(decimal('999999999999999999.99'), decimal('0.01')),
      '1000000000000000000',
    );
    expectDecimalResult(
      multiplyDecimals(decimal('1.234567890123456789'), decimal('1000000000000000000')),
      '1234567890123456789',
    );
  });

  it('rounds repeating divisions according to the engine precision', () => {
    const result = divideDecimals(decimal('1'), decimal('3'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(decimalToString(result.value)).toBe('0.3333333333333333333333333333333333333333');
    }
  });
});

describe('scientific functions', () => {
  it('uses the requested angle mode for trig and inverse trig functions', () => {
    expectScientificValue(sinDecimal(decimal('90'), { angleMode: 'deg' }), 1);
    expectScientificValue(cosDecimal(decimal('0'), { angleMode: 'rad' }), 1);
    expectScientificValue(
      applyScientificFunction('asin', [decimal('1')], { angleMode: 'deg' }),
      90,
    );
  });

  it('evaluates logarithms, exponents, powers, and roots', () => {
    expectScientificString(log10Decimal(decimal('1000')), '3');
    expectScientificValue(lnDecimal(decimal('2.718281828459045235360287471352662497757')), 1);
    expectScientificString(powerDecimal(decimal('2'), decimal('10')), '1024');
    expectScientificString(sqrtDecimal(decimal('144')), '12');
    expectScientificString(rootDecimal(decimal('-27'), decimal('3')), '-3');
  });

  it('returns domain and arity errors for invalid scientific operations', () => {
    expectScientificError(log10Decimal(decimal('-1')), 'domain-error');
    expectScientificError(sqrtDecimal(decimal('-1')), 'domain-error');
    expectScientificError(rootDecimal(decimal('-16'), decimal('2')), 'domain-error');
    expectScientificError(expDecimal(decimal('100000000000000000')), 'decimal-error');
    expectScientificError(applyScientificFunction('pow', [decimal('2')]), 'invalid-arity');
  });
});

import Decimal from 'decimal.js';

export const DECIMAL_PRECISION = 40;

export const DecimalEngine = Decimal.clone({
  precision: DECIMAL_PRECISION,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 30,
});

export type DecimalValue = Decimal;
export type DecimalInput = DecimalValue | string | number;

export type DecimalErrorCode = 'invalid-decimal' | 'divide-by-zero' | 'non-finite-result';

export interface DecimalArithmeticError {
  code: DecimalErrorCode;
  message: string;
}

export type DecimalResult =
  | {
      ok: true;
      value: DecimalValue;
    }
  | {
      ok: false;
      error: DecimalArithmeticError;
    };

export function createDecimal(input: DecimalInput): DecimalResult {
  try {
    return ensureFinite(new DecimalEngine(input));
  } catch {
    return {
      ok: false,
      error: {
        code: 'invalid-decimal',
        message: `Invalid decimal value "${String(input)}".`,
      },
    };
  }
}

export function addDecimals(left: DecimalValue, right: DecimalValue): DecimalResult {
  return ensureFinite(left.plus(right));
}

export function subtractDecimals(left: DecimalValue, right: DecimalValue): DecimalResult {
  return ensureFinite(left.minus(right));
}

export function multiplyDecimals(left: DecimalValue, right: DecimalValue): DecimalResult {
  return ensureFinite(left.times(right));
}

export function divideDecimals(left: DecimalValue, right: DecimalValue): DecimalResult {
  if (right.isZero()) {
    return {
      ok: false,
      error: {
        code: 'divide-by-zero',
        message: 'Cannot divide by zero.',
      },
    };
  }

  return ensureFinite(left.div(right));
}

export function negateDecimal(value: DecimalValue): DecimalResult {
  return ensureFinite(value.negated());
}

export function decimalToString(value: DecimalValue): string {
  return value.toString();
}

export function ensureFiniteDecimal(value: DecimalValue): DecimalResult {
  return ensureFinite(value);
}

function ensureFinite(value: DecimalValue): DecimalResult {
  if (value.isFinite()) {
    return {
      ok: true,
      value,
    };
  }

  return {
    ok: false,
    error: {
      code: 'non-finite-result',
      message: 'Decimal result is not finite.',
    },
  };
}

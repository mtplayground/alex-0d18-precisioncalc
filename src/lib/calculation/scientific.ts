import { DecimalEngine, ensureFiniteDecimal } from '../decimal';
import type { DecimalResult, DecimalValue } from '../decimal';
import { angleFromRadians, angleToRadians } from '../formatting';
import type { AngleMode } from '../formatting';

export type ScientificFunctionName =
  'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'log' | 'ln' | 'exp' | 'pow' | 'sqrt' | 'root';

export type ScientificErrorCode = 'domain-error' | 'invalid-arity' | 'decimal-error';

export interface ScientificFunctionOptions {
  angleMode?: AngleMode;
}

export interface ScientificFunctionError {
  code: ScientificErrorCode;
  message: string;
}

export type ScientificFunctionResult =
  | {
      ok: true;
      value: DecimalValue;
    }
  | {
      ok: false;
      error: ScientificFunctionError;
    };

export function applyScientificFunction(
  name: ScientificFunctionName,
  args: DecimalValue[],
  options: ScientificFunctionOptions = {},
): ScientificFunctionResult {
  switch (name) {
    case 'sin':
      return unaryFunction(name, args, (value) => sinDecimal(value, options));
    case 'cos':
      return unaryFunction(name, args, (value) => cosDecimal(value, options));
    case 'tan':
      return unaryFunction(name, args, (value) => tanDecimal(value, options));
    case 'asin':
      return unaryFunction(name, args, (value) => asinDecimal(value, options));
    case 'acos':
      return unaryFunction(name, args, (value) => acosDecimal(value, options));
    case 'atan':
      return unaryFunction(name, args, (value) => atanDecimal(value, options));
    case 'log':
      return unaryFunction(name, args, log10Decimal);
    case 'ln':
      return unaryFunction(name, args, lnDecimal);
    case 'exp':
      return unaryFunction(name, args, expDecimal);
    case 'sqrt':
      return unaryFunction(name, args, sqrtDecimal);
    case 'pow':
      return binaryFunction(name, args, powerDecimal);
    case 'root':
      return binaryFunction(name, args, rootDecimal);
  }
}

export function sinDecimal(
  value: DecimalValue,
  options: ScientificFunctionOptions = {},
): ScientificFunctionResult {
  const radians = angleToScientificRadians(value, options);

  if (!radians.ok) {
    return radians;
  }

  return decimalOperationToScientific(() => radians.value.sin());
}

export function cosDecimal(
  value: DecimalValue,
  options: ScientificFunctionOptions = {},
): ScientificFunctionResult {
  const radians = angleToScientificRadians(value, options);

  if (!radians.ok) {
    return radians;
  }

  return decimalOperationToScientific(() => radians.value.cos());
}

export function tanDecimal(
  value: DecimalValue,
  options: ScientificFunctionOptions = {},
): ScientificFunctionResult {
  const radians = angleToScientificRadians(value, options);

  if (!radians.ok) {
    return radians;
  }

  return decimalOperationToScientific(() => radians.value.tan());
}

export function asinDecimal(
  value: DecimalValue,
  options: ScientificFunctionOptions = {},
): ScientificFunctionResult {
  if (!isWithinInclusive(value, -1, 1)) {
    return domainError('asin input must be between -1 and 1.');
  }

  return decimalOperationToScientific(() => {
    const radians = value.asin();
    return angleFromScientificRadians(radians, options);
  });
}

export function acosDecimal(
  value: DecimalValue,
  options: ScientificFunctionOptions = {},
): ScientificFunctionResult {
  if (!isWithinInclusive(value, -1, 1)) {
    return domainError('acos input must be between -1 and 1.');
  }

  return decimalOperationToScientific(() => {
    const radians = value.acos();
    return angleFromScientificRadians(radians, options);
  });
}

export function atanDecimal(
  value: DecimalValue,
  options: ScientificFunctionOptions = {},
): ScientificFunctionResult {
  return decimalOperationToScientific(() => {
    const radians = value.atan();
    return angleFromScientificRadians(radians, options);
  });
}

export function log10Decimal(value: DecimalValue): ScientificFunctionResult {
  if (!value.gt(0)) {
    return domainError('log input must be greater than 0.');
  }

  return decimalOperationToScientific(() => value.log());
}

export function lnDecimal(value: DecimalValue): ScientificFunctionResult {
  if (!value.gt(0)) {
    return domainError('ln input must be greater than 0.');
  }

  return decimalOperationToScientific(() => value.ln());
}

export function expDecimal(value: DecimalValue): ScientificFunctionResult {
  return decimalOperationToScientific(() => value.exp());
}

export function powerDecimal(base: DecimalValue, exponent: DecimalValue): ScientificFunctionResult {
  if (base.isNegative() && !exponent.isInteger()) {
    return domainError('Negative bases require an integer exponent.');
  }

  return decimalOperationToScientific(() => base.pow(exponent));
}

export function sqrtDecimal(value: DecimalValue): ScientificFunctionResult {
  if (value.isNegative()) {
    return domainError('sqrt input must be greater than or equal to 0.');
  }

  return decimalOperationToScientific(() => value.sqrt());
}

export function rootDecimal(value: DecimalValue, degree: DecimalValue): ScientificFunctionResult {
  if (degree.isZero()) {
    return domainError('Root degree cannot be 0.');
  }

  if (!degree.isInteger()) {
    return domainError('Root degree must be an integer.');
  }

  if (value.isNegative() && !isOddInteger(degree)) {
    return domainError('Negative radicands require an odd integer root degree.');
  }

  return decimalOperationToScientific(() => {
    if (value.isNegative()) {
      return value.negated().pow(new DecimalEngine(1).div(degree)).negated();
    }

    return value.pow(new DecimalEngine(1).div(degree));
  });
}

function unaryFunction(
  name: ScientificFunctionName,
  args: DecimalValue[],
  operation: (value: DecimalValue) => ScientificFunctionResult,
): ScientificFunctionResult {
  if (args.length !== 1) {
    return arityError(`${name} expects 1 argument.`);
  }

  return operation(args[0]);
}

function binaryFunction(
  name: ScientificFunctionName,
  args: DecimalValue[],
  operation: (left: DecimalValue, right: DecimalValue) => ScientificFunctionResult,
): ScientificFunctionResult {
  if (args.length !== 2) {
    return arityError(`${name} expects 2 arguments.`);
  }

  return operation(args[0], args[1]);
}

function decimalOperationToScientific(operation: () => DecimalValue): ScientificFunctionResult {
  try {
    return decimalResultToScientific(operation());
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'decimal-error',
        message: error instanceof Error ? error.message : 'Decimal operation failed.',
      },
    };
  }
}

function decimalResultToScientific(value: DecimalValue): ScientificFunctionResult {
  const result = ensureFiniteDecimal(value);

  if (result.ok) {
    return result;
  }

  return decimalErrorToScientific(result);
}

function angleToScientificRadians(
  value: DecimalValue,
  options: ScientificFunctionOptions,
): ScientificFunctionResult {
  const result = angleToRadians(value, options.angleMode ?? 'rad');

  if (result.ok) {
    return result;
  }

  return decimalErrorToScientific(result);
}

function angleFromScientificRadians(
  value: DecimalValue,
  options: ScientificFunctionOptions,
): DecimalValue {
  const result = angleFromRadians(value, options.angleMode ?? 'rad');

  if (result.ok) {
    return result.value;
  }

  throw new Error(result.error.message);
}

function decimalErrorToScientific(result: DecimalResult): ScientificFunctionResult {
  if (result.ok) {
    return result;
  }

  return {
    ok: false,
    error: {
      code: 'decimal-error',
      message: result.error.message,
    },
  };
}

function isWithinInclusive(value: DecimalValue, min: number, max: number): boolean {
  return value.gte(min) && value.lte(max);
}

function isOddInteger(value: DecimalValue): boolean {
  return value.isInteger() && value.abs().mod(2).eq(1);
}

function domainError(message: string): ScientificFunctionResult {
  return {
    ok: false,
    error: {
      code: 'domain-error',
      message,
    },
  };
}

function arityError(message: string): ScientificFunctionResult {
  return {
    ok: false,
    error: {
      code: 'invalid-arity',
      message,
    },
  };
}

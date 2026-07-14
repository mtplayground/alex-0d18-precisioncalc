import { DecimalEngine, ensureFiniteDecimal } from '../decimal';
import type { DecimalResult, DecimalValue } from '../decimal';

export type AngleMode = 'deg' | 'rad';
export type NotationMode = 'standard' | 'scientific';

export interface CalculatorModeSettings {
  angleMode: AngleMode;
  notationMode: NotationMode;
}

export interface DecimalFormatOptions {
  notationMode?: NotationMode;
  maxFractionDigits?: number;
  significantDigits?: number;
  trimTrailingZeros?: boolean;
}

export const DEFAULT_MODE_SETTINGS: CalculatorModeSettings = {
  angleMode: 'deg',
  notationMode: 'standard',
};

const DEFAULT_MAX_FRACTION_DIGITS = 12;
const DEFAULT_SIGNIFICANT_DIGITS = 12;
const MIN_DIGITS = 1;
const MAX_DIGITS = 40;

export function toggleAngleMode(current: AngleMode): AngleMode {
  return current === 'deg' ? 'rad' : 'deg';
}

export function toggleNotationMode(current: NotationMode): NotationMode {
  return current === 'standard' ? 'scientific' : 'standard';
}

export function angleToRadians(value: DecimalValue, mode: AngleMode): DecimalResult {
  if (mode === 'rad') {
    return ensureFiniteDecimal(value);
  }

  return ensureFiniteDecimal(value.times(piDecimal()).div(180));
}

export function angleFromRadians(value: DecimalValue, mode: AngleMode): DecimalResult {
  if (mode === 'rad') {
    return ensureFiniteDecimal(value);
  }

  return ensureFiniteDecimal(value.times(180).div(piDecimal()));
}

export function formatDecimalValue(
  value: DecimalValue,
  options: DecimalFormatOptions = {},
): string {
  const notationMode = options.notationMode ?? DEFAULT_MODE_SETTINGS.notationMode;

  if (notationMode === 'scientific') {
    return formatScientific(value, options);
  }

  return formatStandard(value, options);
}

function formatStandard(value: DecimalValue, options: DecimalFormatOptions): string {
  const maxFractionDigits = clampDigitCount(
    options.maxFractionDigits ?? DEFAULT_MAX_FRACTION_DIGITS,
  );
  const rounded = value.toDecimalPlaces(maxFractionDigits);
  const formatted = rounded.isZero() ? '0' : rounded.toFixed();

  return options.trimTrailingZeros === false ? formatted : trimTrailingZeros(formatted);
}

function formatScientific(value: DecimalValue, options: DecimalFormatOptions): string {
  const significantDigits = clampDigitCount(
    options.significantDigits ?? DEFAULT_SIGNIFICANT_DIGITS,
  );
  const formatted = value
    .toSignificantDigits(significantDigits)
    .toExponential(significantDigits - 1);

  if (options.trimTrailingZeros === false) {
    return formatted;
  }

  const [mantissa, exponent] = formatted.split('e');
  return `${trimTrailingZeros(mantissa)}e${exponent}`;
}

function trimTrailingZeros(value: string): string {
  if (!value.includes('.')) {
    return value;
  }

  return value.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
}

function clampDigitCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SIGNIFICANT_DIGITS;
  }

  return Math.min(MAX_DIGITS, Math.max(MIN_DIGITS, Math.trunc(value)));
}

function piDecimal(): DecimalValue {
  return new DecimalEngine(-1).acos();
}

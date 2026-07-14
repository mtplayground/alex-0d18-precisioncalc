import {
  addDecimals,
  createDecimal,
  decimalToString,
  DecimalEngine,
  subtractDecimals,
} from '../decimal';
import type { DecimalInput, DecimalResult, DecimalValue } from '../decimal';

export type MemoryOperation = 'M+' | 'M-' | 'MR' | 'MC';
export type MemoryErrorCode = 'missing-operand' | 'invalid-value' | 'decimal-error';

export interface MemoryRegisterState {
  value: DecimalValue;
  hasValue: boolean;
  updatedAt: string | null;
}

export interface SerializedMemoryRegister {
  value: string | null;
  updatedAt: string | null;
}

export interface MemoryRegisterError {
  code: MemoryErrorCode;
  message: string;
}

export type MemoryRegisterResult =
  | {
      ok: true;
      state: MemoryRegisterState;
    }
  | {
      ok: false;
      error: MemoryRegisterError;
    };

export type MemoryOperationResult =
  | {
      ok: true;
      state: MemoryRegisterState;
      recalledValue: DecimalValue | null;
    }
  | {
      ok: false;
      error: MemoryRegisterError;
    };

export function createEmptyMemoryRegister(): MemoryRegisterState {
  return {
    value: zeroDecimal(),
    hasValue: false,
    updatedAt: null,
  };
}

export function createMemoryRegister(value?: DecimalInput): MemoryRegisterResult {
  if (value === undefined) {
    return {
      ok: true,
      state: createEmptyMemoryRegister(),
    };
  }

  const decimal = createDecimal(value);

  if (!decimal.ok) {
    return {
      ok: false,
      error: decimalErrorToMemoryError(decimal, 'invalid-value'),
    };
  }

  return {
    ok: true,
    state: {
      value: decimal.value,
      hasValue: true,
      updatedAt: null,
    },
  };
}

export function memoryAdd(state: MemoryRegisterState, amount: DecimalInput): MemoryRegisterResult {
  const decimal = createDecimal(amount);

  if (!decimal.ok) {
    return {
      ok: false,
      error: decimalErrorToMemoryError(decimal, 'invalid-value'),
    };
  }

  return decimalResultToMemoryState(addDecimals(currentMemoryValue(state), decimal.value));
}

export function memorySubtract(
  state: MemoryRegisterState,
  amount: DecimalInput,
): MemoryRegisterResult {
  const decimal = createDecimal(amount);

  if (!decimal.ok) {
    return {
      ok: false,
      error: decimalErrorToMemoryError(decimal, 'invalid-value'),
    };
  }

  return decimalResultToMemoryState(subtractDecimals(currentMemoryValue(state), decimal.value));
}

export function memoryRecall(state: MemoryRegisterState): DecimalValue {
  return currentMemoryValue(state);
}

export function memoryClear(): MemoryRegisterState {
  return {
    ...createEmptyMemoryRegister(),
    updatedAt: new Date().toISOString(),
  };
}

export function applyMemoryOperation(
  operation: MemoryOperation,
  state: MemoryRegisterState,
  operand?: DecimalInput,
): MemoryOperationResult {
  if (operation === 'MR') {
    return {
      ok: true,
      state,
      recalledValue: memoryRecall(state),
    };
  }

  if (operation === 'MC') {
    return {
      ok: true,
      state: memoryClear(),
      recalledValue: null,
    };
  }

  if (operand === undefined) {
    return {
      ok: false,
      error: {
        code: 'missing-operand',
        message: `${operation} requires a decimal operand.`,
      },
    };
  }

  const result = operation === 'M+' ? memoryAdd(state, operand) : memorySubtract(state, operand);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    state: result.state,
    recalledValue: null,
  };
}

export function serializeMemoryRegister(state: MemoryRegisterState): SerializedMemoryRegister {
  return {
    value: state.hasValue ? decimalToString(state.value) : null,
    updatedAt: state.updatedAt,
  };
}

export function hydrateMemoryRegister(
  serialized: SerializedMemoryRegister | null | undefined,
): MemoryRegisterResult {
  if (!serialized?.value) {
    return {
      ok: true,
      state: createEmptyMemoryRegister(),
    };
  }

  const decimal = createDecimal(serialized.value);

  if (!decimal.ok) {
    return {
      ok: false,
      error: decimalErrorToMemoryError(decimal, 'invalid-value'),
    };
  }

  return {
    ok: true,
    state: {
      value: decimal.value,
      hasValue: true,
      updatedAt: serialized.updatedAt,
    },
  };
}

function currentMemoryValue(state: MemoryRegisterState): DecimalValue {
  return state.hasValue ? state.value : zeroDecimal();
}

function decimalResultToMemoryState(result: DecimalResult): MemoryRegisterResult {
  if (!result.ok) {
    return {
      ok: false,
      error: decimalErrorToMemoryError(result, 'decimal-error'),
    };
  }

  return {
    ok: true,
    state: {
      value: result.value,
      hasValue: true,
      updatedAt: new Date().toISOString(),
    },
  };
}

function decimalErrorToMemoryError(
  result: DecimalResult,
  fallbackCode: MemoryErrorCode,
): MemoryRegisterError {
  if (result.ok) {
    return {
      code: fallbackCode,
      message: 'Memory register operation failed.',
    };
  }

  return {
    code: fallbackCode,
    message: result.error.message,
  };
}

function zeroDecimal(): DecimalValue {
  return new DecimalEngine(0);
}

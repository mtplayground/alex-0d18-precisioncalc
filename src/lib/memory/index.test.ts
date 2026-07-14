import { describe, expect, it } from 'vitest';

import { decimalToString } from '../decimal';
import {
  applyMemoryOperation,
  createEmptyMemoryRegister,
  createMemoryRegister,
  hydrateMemoryRegister,
  memoryAdd,
  memoryClear,
  memoryRecall,
  memorySubtract,
  serializeMemoryRegister,
} from './index';
import type { MemoryOperationResult, MemoryRegisterResult, MemoryRegisterState } from './index';

function expectMemoryResult(
  result: MemoryRegisterResult,
  expectedValue: string,
): MemoryRegisterState {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  expect(result.state.hasValue).toBe(true);
  expect(decimalToString(result.state.value)).toBe(expectedValue);
  expectValidIsoTimestamp(result.state.updatedAt);

  return result.state;
}

function expectMemoryOperationResult(
  result: MemoryOperationResult,
  expectedValue: string,
): MemoryRegisterState {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  expect(result.recalledValue).toBeNull();
  expect(result.state.hasValue).toBe(true);
  expect(decimalToString(result.state.value)).toBe(expectedValue);
  expectValidIsoTimestamp(result.state.updatedAt);

  return result.state;
}

function expectValidIsoTimestamp(value: string | null): void {
  expect(value).toEqual(expect.any(String));
  expect(Number.isNaN(Date.parse(value ?? ''))).toBe(false);
}

describe('memory register state', () => {
  it('starts empty and recalls zero until a value is stored', () => {
    const state = createEmptyMemoryRegister();

    expect(state.hasValue).toBe(false);
    expect(decimalToString(state.value)).toBe('0');
    expect(state.updatedAt).toBeNull();
    expect(decimalToString(memoryRecall(state))).toBe('0');
    expect(serializeMemoryRegister(state)).toEqual({
      value: null,
      updatedAt: null,
    });
  });

  it('adds and subtracts using precision-safe decimal arithmetic', () => {
    const afterFirstAdd = expectMemoryResult(memoryAdd(createEmptyMemoryRegister(), '0.1'), '0.1');
    const afterSecondAdd = expectMemoryResult(memoryAdd(afterFirstAdd, '0.2'), '0.3');
    const afterSubtract = expectMemoryResult(memorySubtract(afterSecondAdd, '0.05'), '0.25');

    expect(decimalToString(memoryRecall(afterSubtract))).toBe('0.25');
  });

  it('applies M+, M-, MR, and MC through the shared operation dispatcher', () => {
    const afterAdd = expectMemoryOperationResult(
      applyMemoryOperation('M+', createEmptyMemoryRegister(), '10'),
      '10',
    );
    const afterSubtract = expectMemoryOperationResult(
      applyMemoryOperation('M-', afterAdd, '3.75'),
      '6.25',
    );
    const recalled = applyMemoryOperation('MR', afterSubtract);

    expect(recalled.ok).toBe(true);
    if (recalled.ok) {
      expect(recalled.state).toBe(afterSubtract);
      expect(recalled.recalledValue).not.toBeNull();
      expect(decimalToString(recalled.recalledValue!)).toBe('6.25');
    }

    const cleared = applyMemoryOperation('MC', afterSubtract);

    expect(cleared.ok).toBe(true);
    if (cleared.ok) {
      expect(cleared.recalledValue).toBeNull();
      expect(cleared.state.hasValue).toBe(false);
      expect(decimalToString(cleared.state.value)).toBe('0');
      expectValidIsoTimestamp(cleared.state.updatedAt);
    }
  });

  it('serializes and hydrates stored memory values', () => {
    const created = createMemoryRegister('42.125');

    expect(created.ok).toBe(true);
    if (!created.ok) {
      throw new Error(created.error.message);
    }

    const serialized = serializeMemoryRegister(created.state);
    const hydrated = hydrateMemoryRegister(serialized);

    expect(serialized).toEqual({
      value: '42.125',
      updatedAt: null,
    });
    expect(hydrated.ok).toBe(true);
    if (hydrated.ok) {
      expect(hydrated.state.hasValue).toBe(true);
      expect(decimalToString(hydrated.state.value)).toBe('42.125');
      expect(hydrated.state.updatedAt).toBeNull();
    }
  });

  it('clears memory without preserving stale stored values', () => {
    const cleared = memoryClear();
    const serialized = serializeMemoryRegister(cleared);
    const hydrated = hydrateMemoryRegister(serialized);

    expect(cleared.hasValue).toBe(false);
    expect(decimalToString(cleared.value)).toBe('0');
    expectValidIsoTimestamp(cleared.updatedAt);
    expect(serialized.value).toBeNull();
    expect(serialized.updatedAt).toBe(cleared.updatedAt);
    expect(hydrated.ok).toBe(true);
    if (hydrated.ok) {
      expect(hydrated.state.hasValue).toBe(false);
      expect(hydrated.state.updatedAt).toBeNull();
    }
  });

  it('returns explicit errors for invalid values and missing operands', () => {
    const invalidCreate = createMemoryRegister('not-a-number');
    const missingOperand = applyMemoryOperation('M+', createEmptyMemoryRegister());
    const invalidHydration = hydrateMemoryRegister({
      value: 'Infinity',
      updatedAt: '2026-07-14T00:00:00.000Z',
    });

    expect(invalidCreate.ok).toBe(false);
    if (!invalidCreate.ok) {
      expect(invalidCreate.error.code).toBe('invalid-value');
    }

    expect(missingOperand.ok).toBe(false);
    if (!missingOperand.ok) {
      expect(missingOperand.error.code).toBe('missing-operand');
    }

    expect(invalidHydration.ok).toBe(false);
    if (!invalidHydration.ok) {
      expect(invalidHydration.error.code).toBe('invalid-value');
    }
  });
});

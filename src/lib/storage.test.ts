import { describe, expect, it } from 'vitest';

import {
  clearPersistedCalculatorState,
  createDefaultCalculatorState,
  readPersistedCalculatorState,
  updatePersistedCalculatorState,
  writePersistedCalculatorState,
} from './storage';
import type { PersistedCalculatorState, StorageLike } from './storage';

class InMemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  constructor(private readonly failure?: 'get' | 'set' | 'remove') {}

  getItem(key: string): string | null {
    if (this.failure === 'get') {
      throw new Error('get failed');
    }

    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failure === 'set') {
      throw new Error('set failed');
    }

    this.values.set(key, value);
  }

  removeItem(key: string): void {
    if (this.failure === 'remove') {
      throw new Error('remove failed');
    }

    this.values.delete(key);
  }
}

const storageKey = 'calculator:test-state';

function calculatorState(
  overrides: Partial<PersistedCalculatorState> = {},
): PersistedCalculatorState {
  return {
    ...createDefaultCalculatorState(),
    history: [
      {
        id: 'history-1',
        expression: '(2 + 3) x 4',
        result: '20',
        createdAt: '2026-07-14T12:00:00.000Z',
        angleMode: 'deg',
        notationMode: 'standard',
      },
      {
        id: 'history-2',
        expression: 'sin(90)',
        result: '1',
        createdAt: '2026-07-14T12:01:00.000Z',
        angleMode: 'deg',
        notationMode: 'scientific',
      },
    ],
    memory: {
      value: '12.5',
      updatedAt: '2026-07-14T12:02:00.000Z',
    },
    preferences: {
      angleMode: 'rad',
      notationMode: 'scientific',
    },
    ...overrides,
  };
}

function readStoredJson(storage: InMemoryStorage): PersistedCalculatorState {
  const storedValue = storage.values.get(storageKey);

  expect(storedValue).toEqual(expect.any(String));
  return JSON.parse(storedValue ?? '') as PersistedCalculatorState;
}

function expectValidIsoTimestamp(value: string | null): void {
  expect(value).toEqual(expect.any(String));
  expect(Number.isNaN(Date.parse(value ?? ''))).toBe(false);
}

describe('calculator state persistence', () => {
  it('returns default state when no persisted state exists', () => {
    const result = readPersistedCalculatorState({
      key: storageKey,
      storage: new InMemoryStorage(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recovered).toBe(false);
      expect(result.state).toEqual(createDefaultCalculatorState());
    }
  });

  it('writes and reads history, memory, and preferences through storage', () => {
    const storage = new InMemoryStorage();
    const state = calculatorState();
    const writeResult = writePersistedCalculatorState(state, { key: storageKey, storage });

    expect(writeResult.ok).toBe(true);
    if (!writeResult.ok) {
      throw new Error(writeResult.error.message);
    }

    expectValidIsoTimestamp(writeResult.state.updatedAt);
    expect(readStoredJson(storage)).toEqual(writeResult.state);

    const readResult = readPersistedCalculatorState({ key: storageKey, storage });

    expect(readResult.ok).toBe(true);
    if (readResult.ok) {
      expect(readResult.state.history).toEqual(state.history);
      expect(readResult.state.memory).toEqual(state.memory);
      expect(readResult.state.preferences).toEqual(state.preferences);
      expect(readResult.state.updatedAt).toBe(writeResult.state.updatedAt);
    }
  });

  it('normalizes persisted history entries and mode values defensively', () => {
    const storage = new InMemoryStorage();

    storage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        history: [
          {
            id: 'history-valid',
            expression: '1 + 2',
            result: '3',
            createdAt: '2026-07-14T12:00:00.000Z',
            angleMode: 'rad',
            notationMode: 'scientific',
          },
          {
            id: '',
            expression: 'missing id',
            result: '0',
            createdAt: '2026-07-14T12:01:00.000Z',
          },
          {
            id: 'history-default-modes',
            expression: '4 + 5',
            result: '9',
            createdAt: '2026-07-14T12:02:00.000Z',
            angleMode: 'bad-mode',
            notationMode: 'bad-mode',
          },
        ],
        memory: {
          value: 99,
          updatedAt: '2026-07-14T12:03:00.000Z',
        },
        preferences: {
          angleMode: 'bad-mode',
          notationMode: 'scientific',
        },
        updatedAt: 123,
      }),
    );

    const result = readPersistedCalculatorState({ key: storageKey, storage });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.history).toEqual([
        {
          id: 'history-valid',
          expression: '1 + 2',
          result: '3',
          createdAt: '2026-07-14T12:00:00.000Z',
          angleMode: 'rad',
          notationMode: 'scientific',
        },
        {
          id: 'history-default-modes',
          expression: '4 + 5',
          result: '9',
          createdAt: '2026-07-14T12:02:00.000Z',
          angleMode: 'deg',
          notationMode: 'standard',
        },
      ]);
      expect(result.state.memory).toEqual({
        value: null,
        updatedAt: '2026-07-14T12:03:00.000Z',
      });
      expect(result.state.preferences).toEqual({
        angleMode: 'deg',
        notationMode: 'scientific',
      });
      expect(result.state.updatedAt).toBeNull();
    }
  });

  it('updates existing persisted state without dropping history or memory', () => {
    const storage = new InMemoryStorage();
    const initialState = calculatorState();

    writePersistedCalculatorState(initialState, { key: storageKey, storage });
    const updateResult = updatePersistedCalculatorState(
      (currentState) => ({
        ...currentState,
        history: [
          {
            id: 'history-3',
            expression: '10 - 4',
            result: '6',
            createdAt: '2026-07-14T12:03:00.000Z',
            angleMode: 'deg',
            notationMode: 'standard',
          },
          ...currentState.history,
        ],
        memory: {
          value: '18.75',
          updatedAt: '2026-07-14T12:04:00.000Z',
        },
      }),
      { key: storageKey, storage },
    );

    expect(updateResult.ok).toBe(true);
    if (updateResult.ok) {
      expect(updateResult.state.history).toHaveLength(3);
      expect(updateResult.state.history[0].result).toBe('6');
      expect(updateResult.state.history[1]).toEqual(initialState.history[0]);
      expect(updateResult.state.memory.value).toBe('18.75');
      expectValidIsoTimestamp(updateResult.state.updatedAt);
    }
  });

  it('clears persisted state from storage', () => {
    const storage = new InMemoryStorage();

    storage.setItem(storageKey, JSON.stringify(calculatorState()));

    const result = clearPersistedCalculatorState({ key: storageKey, storage });

    expect(result.ok).toBe(true);
    expect(storage.getItem(storageKey)).toBeNull();
  });

  it('returns default state and explicit errors for unreadable stored data', () => {
    const invalidJsonStorage = new InMemoryStorage();
    invalidJsonStorage.setItem(storageKey, '{not-json');

    const invalidJson = readPersistedCalculatorState({
      key: storageKey,
      storage: invalidJsonStorage,
    });
    const invalidStateStorage = new InMemoryStorage();
    invalidStateStorage.setItem(storageKey, JSON.stringify({ version: 999 }));
    const invalidState = readPersistedCalculatorState({
      key: storageKey,
      storage: invalidStateStorage,
    });

    expect(invalidJson.ok).toBe(false);
    if (!invalidJson.ok) {
      expect(invalidJson.error.reason).toBe('invalid-json');
      expect(invalidJson.state).toEqual(createDefaultCalculatorState());
    }

    expect(invalidState.ok).toBe(false);
    if (!invalidState.ok) {
      expect(invalidState.error.reason).toBe('invalid-state');
      expect(invalidState.state).toEqual(createDefaultCalculatorState());
    }
  });

  it('surfaces storage availability and operation failures', () => {
    expect(readPersistedCalculatorState({ storage: null }).ok).toBe(false);

    const readFailed = readPersistedCalculatorState({
      key: storageKey,
      storage: new InMemoryStorage('get'),
    });
    const writeFailed = writePersistedCalculatorState(calculatorState(), {
      key: storageKey,
      storage: new InMemoryStorage('set'),
    });
    const clearFailed = clearPersistedCalculatorState({
      key: storageKey,
      storage: new InMemoryStorage('remove'),
    });

    expect(readFailed.ok).toBe(false);
    if (!readFailed.ok) {
      expect(readFailed.error.reason).toBe('read-failed');
    }

    expect(writeFailed.ok).toBe(false);
    if (!writeFailed.ok) {
      expect(writeFailed.error.reason).toBe('write-failed');
    }

    expect(clearFailed.ok).toBe(false);
    if (!clearFailed.ok) {
      expect(clearFailed.error.reason).toBe('clear-failed');
    }
  });
});

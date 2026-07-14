export const CURRENT_STORAGE_VERSION = 1;
export const CALCULATOR_STORAGE_KEY = 'calculator:persisted-state:v1';

export type AngleMode = 'deg' | 'rad';
export type NotationMode = 'standard' | 'scientific';

export interface PersistedHistoryEntry {
  id: string;
  expression: string;
  result: string;
  createdAt: string;
  angleMode: AngleMode;
  notationMode: NotationMode;
}

export interface PersistedMemoryState {
  value: string | null;
  updatedAt: string | null;
}

export interface PersistedModePreferences {
  angleMode: AngleMode;
  notationMode: NotationMode;
}

export interface PersistedCalculatorState {
  version: typeof CURRENT_STORAGE_VERSION;
  history: PersistedHistoryEntry[];
  memory: PersistedMemoryState;
  preferences: PersistedModePreferences;
  updatedAt: string | null;
}

export type StorageFailureReason =
  | 'storage-unavailable'
  | 'read-failed'
  | 'invalid-json'
  | 'invalid-state'
  | 'write-failed'
  | 'clear-failed';

export interface StorageFailure {
  reason: StorageFailureReason;
  message: string;
}

export type StorageReadResult =
  | {
      ok: true;
      state: PersistedCalculatorState;
      recovered: boolean;
    }
  | {
      ok: false;
      state: PersistedCalculatorState;
      error: StorageFailure;
    };

export type StorageWriteResult =
  | {
      ok: true;
      state: PersistedCalculatorState;
    }
  | {
      ok: false;
      error: StorageFailure;
    };

export type StorageClearResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: StorageFailure;
    };

export interface StorageOptions {
  key?: string;
  storage?: StorageLike | null;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type JsonRecord = Record<string, unknown>;

export function createDefaultCalculatorState(): PersistedCalculatorState {
  return {
    version: CURRENT_STORAGE_VERSION,
    history: [],
    memory: {
      value: null,
      updatedAt: null,
    },
    preferences: {
      angleMode: 'deg',
      notationMode: 'standard',
    },
    updatedAt: null,
  };
}

export function readPersistedCalculatorState(options: StorageOptions = {}): StorageReadResult {
  const storage = resolveStorage(options.storage);
  const key = options.key ?? CALCULATOR_STORAGE_KEY;
  const defaultState = createDefaultCalculatorState();

  if (!storage) {
    return {
      ok: false,
      state: defaultState,
      error: {
        reason: 'storage-unavailable',
        message: 'Browser local storage is not available.',
      },
    };
  }

  let storedValue: string | null;

  try {
    storedValue = storage.getItem(key);
  } catch (error) {
    return {
      ok: false,
      state: defaultState,
      error: {
        reason: 'read-failed',
        message: getErrorMessage(error, 'Failed to read calculator state from local storage.'),
      },
    };
  }

  if (storedValue === null) {
    return {
      ok: true,
      state: defaultState,
      recovered: false,
    };
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(storedValue);
  } catch {
    return {
      ok: false,
      state: defaultState,
      error: {
        reason: 'invalid-json',
        message: 'Stored calculator state is not valid JSON.',
      },
    };
  }

  const normalizedState = normalizeCalculatorState(parsedValue);

  if (!normalizedState) {
    return {
      ok: false,
      state: defaultState,
      error: {
        reason: 'invalid-state',
        message: 'Stored calculator state does not match the expected shape.',
      },
    };
  }

  return {
    ok: true,
    state: normalizedState,
    recovered: false,
  };
}

export function writePersistedCalculatorState(
  state: PersistedCalculatorState,
  options: StorageOptions = {},
): StorageWriteResult {
  const storage = resolveStorage(options.storage);
  const key = options.key ?? CALCULATOR_STORAGE_KEY;

  if (!storage) {
    return {
      ok: false,
      error: {
        reason: 'storage-unavailable',
        message: 'Browser local storage is not available.',
      },
    };
  }

  const stateToPersist = markStateUpdated(state);

  try {
    storage.setItem(key, JSON.stringify(stateToPersist));
  } catch (error) {
    return {
      ok: false,
      error: {
        reason: 'write-failed',
        message: getErrorMessage(error, 'Failed to write calculator state to local storage.'),
      },
    };
  }

  return {
    ok: true,
    state: stateToPersist,
  };
}

export function updatePersistedCalculatorState(
  update: (currentState: PersistedCalculatorState) => PersistedCalculatorState,
  options: StorageOptions = {},
): StorageWriteResult {
  const readResult = readPersistedCalculatorState(options);
  const nextState = update(readResult.state);

  return writePersistedCalculatorState(nextState, options);
}

export function clearPersistedCalculatorState(options: StorageOptions = {}): StorageClearResult {
  const storage = resolveStorage(options.storage);
  const key = options.key ?? CALCULATOR_STORAGE_KEY;

  if (!storage) {
    return {
      ok: false,
      error: {
        reason: 'storage-unavailable',
        message: 'Browser local storage is not available.',
      },
    };
  }

  try {
    storage.removeItem(key);
  } catch (error) {
    return {
      ok: false,
      error: {
        reason: 'clear-failed',
        message: getErrorMessage(error, 'Failed to clear calculator state from local storage.'),
      },
    };
  }

  return { ok: true };
}

function normalizeCalculatorState(value: unknown): PersistedCalculatorState | null {
  if (!isRecord(value) || value.version !== CURRENT_STORAGE_VERSION) {
    return null;
  }

  return {
    version: CURRENT_STORAGE_VERSION,
    history: normalizeHistory(value.history),
    memory: normalizeMemoryState(value.memory),
    preferences: normalizeModePreferences(value.preferences),
    updatedAt: normalizeNullableString(value.updatedAt),
  };
}

function normalizeHistory(value: unknown): PersistedHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const normalizedEntry = normalizeHistoryEntry(entry);
    return normalizedEntry ? [normalizedEntry] : [];
  });
}

function normalizeHistoryEntry(value: unknown): PersistedHistoryEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeRequiredString(value.id);
  const expression = normalizeRequiredString(value.expression);
  const result = normalizeRequiredString(value.result);
  const createdAt = normalizeRequiredString(value.createdAt);

  if (!id || !expression || !result || !createdAt) {
    return null;
  }

  return {
    id,
    expression,
    result,
    createdAt,
    angleMode: normalizeAngleMode(value.angleMode),
    notationMode: normalizeNotationMode(value.notationMode),
  };
}

function normalizeMemoryState(value: unknown): PersistedMemoryState {
  if (!isRecord(value)) {
    return {
      value: null,
      updatedAt: null,
    };
  }

  return {
    value: normalizeNullableString(value.value),
    updatedAt: normalizeNullableString(value.updatedAt),
  };
}

function normalizeModePreferences(value: unknown): PersistedModePreferences {
  if (!isRecord(value)) {
    return {
      angleMode: 'deg',
      notationMode: 'standard',
    };
  }

  return {
    angleMode: normalizeAngleMode(value.angleMode),
    notationMode: normalizeNotationMode(value.notationMode),
  };
}

function markStateUpdated(state: PersistedCalculatorState): PersistedCalculatorState {
  return {
    ...state,
    version: CURRENT_STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

function resolveStorage(storage: StorageLike | null | undefined): StorageLike | null {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeAngleMode(value: unknown): AngleMode {
  return value === 'rad' ? 'rad' : 'deg';
}

function normalizeNotationMode(value: unknown): NotationMode {
  return value === 'scientific' ? 'scientific' : 'standard';
}

function normalizeRequiredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

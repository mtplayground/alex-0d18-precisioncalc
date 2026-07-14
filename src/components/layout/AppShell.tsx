import { useCallback, useEffect, useState } from 'react';

import { decimalToString } from '../../lib/decimal';
import { resolveKeyboardInputAction, type KeyboardInputAction } from '../../lib/keyboard';
import {
  applyMemoryOperation,
  createEmptyMemoryRegister,
  hydrateMemoryRegister,
  serializeMemoryRegister,
  type MemoryOperation,
  type MemoryRegisterState,
} from '../../lib/memory';
import {
  createDefaultCalculatorState,
  readPersistedCalculatorState,
  writePersistedCalculatorState,
  type PersistedCalculatorState,
  type PersistedHistoryEntry,
  type PersistedModePreferences,
} from '../../lib/storage';
import { CoreArithmeticButtonGrid } from '../buttons/CoreArithmeticButtonGrid';
import { MemoryRegisterControls } from '../buttons/MemoryRegisterControls';
import { ModeToggleControls } from '../buttons/ModeToggleControls';
import { ScientificFunctionCluster } from '../buttons/ScientificFunctionCluster';
import { HistoryTrail, type HistoryTrailEntry } from '../display/HistoryTrail';
import { PrimaryDisplay } from '../display/PrimaryDisplay';

const seedHistoryEntries: PersistedHistoryEntry[] = [
  {
    id: 'history-3',
    expression: '12 x 4 + 7',
    result: '55',
    createdAt: '2026-07-14T09:42:00.000Z',
    angleMode: 'deg',
    notationMode: 'standard',
  },
  {
    id: 'history-2',
    expression: '48 + 7',
    result: '55',
    createdAt: '2026-07-14T09:41:00.000Z',
    angleMode: 'deg',
    notationMode: 'standard',
  },
  {
    id: 'history-1',
    expression: '55 / 5',
    result: '11',
    createdAt: '2026-07-14T09:40:00.000Z',
    angleMode: 'deg',
    notationMode: 'standard',
  },
];

const currentExpression = '12 x 4 + 7';
const currentResult = '55';

const handleHistoryEntry = () => undefined;
const handleCoreArithmeticButton = (value?: unknown) => {
  void value;
};
const handleScientificFunction = (value?: unknown) => {
  void value;
};
const handleMemoryRecall = (value?: string) => {
  void value;
};

export function AppShell() {
  const [persistentState] = useState(loadPersistentShellState);
  const [historyEntries] = useState(persistentState.history);
  const [memoryRegister, setMemoryRegister] = useState(persistentState.memory);
  const [modePreferences, setModePreferences] = useState(persistentState.preferences);

  const handleAngleModeChange = useCallback((angleMode: PersistedModePreferences['angleMode']) => {
    setModePreferences((current) => ({ ...current, angleMode }));
  }, []);

  const handleNotationModeChange = useCallback(
    (notationMode: PersistedModePreferences['notationMode']) => {
      setModePreferences((current) => ({ ...current, notationMode }));
    },
    [],
  );

  const handleToggleAngleMode = useCallback(() => {
    setModePreferences((current) => ({
      ...current,
      angleMode: current.angleMode === 'deg' ? 'rad' : 'deg',
    }));
  }, []);

  const handleToggleNotationMode = useCallback(() => {
    setModePreferences((current) => ({
      ...current,
      notationMode: current.notationMode === 'standard' ? 'scientific' : 'standard',
    }));
  }, []);

  const handleMemoryOperation = useCallback(
    (operation: MemoryOperation) => {
      const operand = operation === 'M+' || operation === 'M-' ? currentResult : undefined;
      const result = applyMemoryOperation(operation, memoryRegister, operand);

      if (!result.ok) {
        return;
      }

      setMemoryRegister(result.state);

      if (result.recalledValue) {
        handleMemoryRecall(decimalToString(result.recalledValue));
      }
    },
    [memoryRegister],
  );

  const dispatchKeyboardAction = useCallback(
    (action: KeyboardInputAction) => {
      if (action.type === 'core') {
        handleCoreArithmeticButton(action.value);
        return;
      }

      if (action.type === 'scientific') {
        handleScientificFunction(action.value);
        return;
      }

      if (action.type === 'memory') {
        handleMemoryOperation(action.operation);
        return;
      }

      if (action.type === 'angle-mode') {
        handleAngleModeChange(action.value);
        return;
      }

      if (action.type === 'notation-mode') {
        handleNotationModeChange(action.value);
        return;
      }

      if (action.type === 'toggle-angle-mode') {
        handleToggleAngleMode();
        return;
      }

      handleToggleNotationMode();
    },
    [
      handleAngleModeChange,
      handleMemoryOperation,
      handleNotationModeChange,
      handleToggleAngleMode,
      handleToggleNotationMode,
    ],
  );

  useEffect(() => {
    persistShellState(historyEntries, memoryRegister, modePreferences);
  }, [historyEntries, memoryRegister, modePreferences]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const action = resolveKeyboardInputAction(event);

      if (!action) {
        return;
      }

      event.preventDefault();
      dispatchKeyboardAction(action);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatchKeyboardAction]);

  return (
    <main className="h-dvh overflow-hidden bg-zinc-950 text-zinc-50">
      <div className="mx-auto grid h-dvh w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] px-2 py-2 sm:px-4 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Scientific Calculator
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              Precision workbench
            </h1>
          </div>
          <ModeToggleControls
            angleMode={modePreferences.angleMode}
            notationMode={modePreferences.notationMode}
            onAngleModeChange={handleAngleModeChange}
            onNotationModeChange={handleNotationModeChange}
          />
        </header>

        <section className="grid min-h-0 gap-2 overflow-hidden py-2">
          <div className="grid h-full min-h-0 grid-rows-[minmax(3.5rem,0.5fr)_minmax(5rem,0.7fr)_minmax(0,3.1fr)] gap-2">
            <HistoryTrail
              entries={historyEntries.map(historyEntryToTrailEntry)}
              maxVisible={2}
              onRecallEntry={handleHistoryEntry}
              onReuseResult={handleHistoryEntry}
            />

            <PrimaryDisplay
              expression={currentExpression}
              pendingOperation="+"
              result={currentResult}
              state="result"
            />

            <section
              aria-label="Calculator controls"
              className="grid min-h-0 grid-cols-[minmax(8rem,0.78fr)_minmax(12rem,1.22fr)] gap-2 lg:grid-cols-[minmax(15rem,0.85fr)_minmax(18rem,1.15fr)]"
            >
              <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2 overflow-hidden">
                <ControlPanel title="Scientific">
                  <ScientificFunctionCluster onFunctionPress={handleScientificFunction} />
                </ControlPanel>

                <ControlPanel title="Memory">
                  <MemoryRegisterControls
                    currentValue={currentResult}
                    memory={memoryRegister}
                    onMemoryChange={setMemoryRegister}
                    onMemoryOperation={handleMemoryOperation}
                    onRecallValue={handleMemoryRecall}
                  />
                </ControlPanel>
              </div>

              <ControlPanel title="Arithmetic">
                <CoreArithmeticButtonGrid onButtonPress={handleCoreArithmeticButton} />
              </ControlPanel>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function ControlPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-zinc-900 p-2 shadow-2xl shadow-black/30 sm:p-3">
      <h2 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {title}
      </h2>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

function loadPersistentShellState(): {
  history: PersistedHistoryEntry[];
  memory: MemoryRegisterState;
  preferences: PersistedModePreferences;
} {
  const storedState = readPersistedCalculatorState();
  const calculatorState = storedState.state;
  const memory = hydrateMemoryRegister(calculatorState.memory);

  return {
    history: calculatorState.history.length > 0 ? calculatorState.history : seedHistoryEntries,
    memory: memory.ok ? memory.state : createEmptyMemoryRegister(),
    preferences: calculatorState.preferences,
  };
}

function persistShellState(
  history: PersistedHistoryEntry[],
  memory: MemoryRegisterState,
  preferences: PersistedModePreferences,
): void {
  const nextState: PersistedCalculatorState = {
    ...createDefaultCalculatorState(),
    history,
    memory: serializeMemoryRegister(memory),
    preferences,
  };

  writePersistedCalculatorState(nextState);
}

function historyEntryToTrailEntry(entry: PersistedHistoryEntry): HistoryTrailEntry {
  return {
    id: entry.id,
    expression: entry.expression,
    result: entry.result,
    timestamp: formatHistoryTimestamp(entry.createdAt),
  };
}

function formatHistoryTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

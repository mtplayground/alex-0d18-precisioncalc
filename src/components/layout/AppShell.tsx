import { useCallback, useEffect, useState } from 'react';

import { applyScientificFunction, evaluateExpression } from '../../lib/calculation';
import { createDecimal, decimalToString, DecimalEngine } from '../../lib/decimal';
import type { DecimalValue } from '../../lib/decimal';
import { formatDecimalValue } from '../../lib/formatting';
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
import type { CoreArithmeticButtonValue } from '../buttons/CoreArithmeticButtonGrid';
import { CoreArithmeticButtonGrid } from '../buttons/CoreArithmeticButtonGrid';
import { MemoryRegisterControls } from '../buttons/MemoryRegisterControls';
import { ModeToggleControls } from '../buttons/ModeToggleControls';
import type { ScientificFunctionValue } from '../buttons/ScientificFunctionCluster';
import { ScientificFunctionCluster } from '../buttons/ScientificFunctionCluster';
import { HistoryTrail, type HistoryTrailEntry } from '../display/HistoryTrail';
import { PrimaryDisplay, type PrimaryDisplayState } from '../display/PrimaryDisplay';

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

const operatorExpression: Partial<Record<CoreArithmeticButtonValue, string>> = {
  add: '+',
  subtract: '-',
  multiply: '×',
  divide: '÷',
};

const operatorDisplay: Partial<Record<CoreArithmeticButtonValue, string>> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

export function AppShell() {
  const [persistentState] = useState(loadPersistentShellState);
  const [historyEntries, setHistoryEntries] = useState(persistentState.history);
  const [memoryRegister, setMemoryRegister] = useState(persistentState.memory);
  const [modePreferences, setModePreferences] = useState(persistentState.preferences);
  const [displayValue, setDisplayValue] = useState('0');
  const [expression, setExpression] = useState('');
  const [displayState, setDisplayState] = useState<PrimaryDisplayState>('input');
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);

  const formattedResult = useCallback(
    (value: Parameters<typeof formatDecimalValue>[0]) =>
      formatDecimalValue(value, { notationMode: modePreferences.notationMode }),
    [modePreferences.notationMode],
  );

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

  const addHistoryEntry = useCallback(
    (nextExpression: string, nextResult: string) => {
      const nextEntry: PersistedHistoryEntry = {
        id: `history-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        expression: nextExpression,
        result: nextResult,
        createdAt: new Date().toISOString(),
        angleMode: modePreferences.angleMode,
        notationMode: modePreferences.notationMode,
      };

      setHistoryEntries((current) => [nextEntry, ...current].slice(0, 20));
    },
    [modePreferences.angleMode, modePreferences.notationMode],
  );

  const setErrorDisplay = useCallback((message: string) => {
    setDisplayValue(message);
    setDisplayState('error');
    setPendingOperation(null);
  }, []);

  const handleCoreArithmeticButton = useCallback(
    (value: CoreArithmeticButtonValue) => {
      if (/^[0-9]$/.test(value)) {
        setDisplayValue((current) => {
          if (
            displayState === 'result' ||
            displayState === 'pending' ||
            displayState === 'error' ||
            current === '0'
          ) {
            return value;
          }

          return `${current}${value}`;
        });
        setDisplayState('input');
        return;
      }

      if (value === 'decimal') {
        setDisplayValue((current) => {
          if (displayState === 'result' || displayState === 'pending' || displayState === 'error') {
            return '0.';
          }

          return current.includes('.') ? current : `${current}.`;
        });
        setDisplayState('input');
        return;
      }

      if (value === 'clear') {
        setDisplayValue('0');
        setExpression('');
        setDisplayState('input');
        setPendingOperation(null);
        return;
      }

      const nextOperator = operatorExpression[value];

      if (nextOperator) {
        const baseExpression =
          displayState === 'result' || !expression.trim()
            ? displayValue
            : `${expression.replace(/[+\-×÷]\s*$/, '').trim()} ${displayValue}`;

        setExpression(`${baseExpression} ${nextOperator}`);
        setPendingOperation(operatorDisplay[value] ?? nextOperator);
        setDisplayState('pending');
        return;
      }

      const trimmedExpression = expression.trim();
      const expressionToEvaluate = /[+\-×÷]$/.test(trimmedExpression)
        ? `${trimmedExpression} ${displayValue}`
        : trimmedExpression || displayValue;
      const result = evaluateExpression(expressionToEvaluate);

      if (!result.ok) {
        setErrorDisplay(result.error.message);
        return;
      }

      const nextResult = formattedResult(result.value);

      setExpression(expressionToEvaluate);
      setDisplayValue(nextResult);
      setDisplayState('result');
      setPendingOperation(null);
      addHistoryEntry(expressionToEvaluate, nextResult);
    },
    [addHistoryEntry, displayState, displayValue, expression, formattedResult, setErrorDisplay],
  );

  const handleScientificFunction = useCallback(
    (value: ScientificFunctionValue) => {
      const parsedValue = createDecimal(displayValue);

      if (!parsedValue.ok) {
        setErrorDisplay(parsedValue.error.message);
        return;
      }

      const operation = resolveScientificOperation(value, parsedValue.value);

      if (!operation) {
        setErrorDisplay(`${value} is not available for direct evaluation.`);
        return;
      }

      const result = applyScientificFunction(operation.name, operation.args, {
        angleMode: modePreferences.angleMode,
      });

      if (!result.ok) {
        setErrorDisplay(result.error.message);
        return;
      }

      const nextResult = formattedResult(result.value);
      const nextExpression = `${operation.label}(${displayValue})`;

      setExpression(nextExpression);
      setDisplayValue(nextResult);
      setDisplayState('result');
      setPendingOperation(null);
      addHistoryEntry(nextExpression, nextResult);
    },
    [addHistoryEntry, displayValue, formattedResult, modePreferences.angleMode, setErrorDisplay],
  );

  const handleHistoryEntry = useCallback((entry: HistoryTrailEntry) => {
    setExpression(entry.expression);
    setDisplayValue(entry.result);
    setDisplayState('result');
    setPendingOperation(null);
  }, []);

  const handleHistoryResultReuse = useCallback((entry: HistoryTrailEntry) => {
    setExpression('');
    setDisplayValue(entry.result);
    setDisplayState('result');
    setPendingOperation(null);
  }, []);

  const handleMemoryRecall = useCallback((value: string) => {
    setDisplayValue(value);
    setDisplayState('result');
    setPendingOperation(null);
  }, []);

  const handleMemoryOperation = useCallback(
    (operation: MemoryOperation) => {
      const operand = operation === 'M+' || operation === 'M-' ? displayValue : undefined;
      const result = applyMemoryOperation(operation, memoryRegister, operand);

      if (!result.ok) {
        return;
      }

      setMemoryRegister(result.state);

      if (result.recalledValue) {
        handleMemoryRecall(decimalToString(result.recalledValue));
      }
    },
    [displayValue, handleMemoryRecall, memoryRegister],
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
      handleCoreArithmeticButton,
      handleMemoryOperation,
      handleNotationModeChange,
      handleScientificFunction,
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
              onReuseResult={handleHistoryResultReuse}
            />

            <PrimaryDisplay
              expression={expression}
              pendingOperation={pendingOperation}
              result={displayValue}
              state={displayState}
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
                    currentValue={displayValue}
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

function resolveScientificOperation(
  value: ScientificFunctionValue,
  currentValue: DecimalValue,
): {
  args: DecimalValue[];
  label: string;
  name: Parameters<typeof applyScientificFunction>[0];
} | null {
  switch (value) {
    case 'sin':
    case 'cos':
    case 'tan':
    case 'asin':
    case 'acos':
    case 'atan':
    case 'log':
    case 'ln':
    case 'exp':
    case 'sqrt':
      return { args: [currentValue], label: value, name: value };
    case 'pow2':
      return {
        args: [currentValue, new DecimalEngine(2)],
        label: 'square',
        name: 'pow',
      };
    case 'pow10':
      return {
        args: [new DecimalEngine(10), currentValue],
        label: '10^',
        name: 'pow',
      };
    case 'cbrt':
      return {
        args: [currentValue, new DecimalEngine(3)],
        label: 'cbrt',
        name: 'root',
      };
    case 'pow':
    case 'root':
      return null;
  }
}

import { decimalToString } from '../../lib/decimal';
import {
  applyMemoryOperation,
  type MemoryOperation,
  type MemoryRegisterState,
} from '../../lib/memory';

export interface MemoryRegisterControlsProps {
  currentValue: string;
  memory: MemoryRegisterState;
  onMemoryChange: (memory: MemoryRegisterState) => void;
  onMemoryOperation?: (operation: MemoryOperation) => void;
  onOperationError?: (message: string) => void;
  onRecallValue?: (value: string) => void;
}

interface MemoryButton {
  operation: MemoryOperation;
  label: string;
  ariaLabel: string;
}

const memoryButtons: MemoryButton[] = [
  {
    operation: 'MC',
    label: 'MC',
    ariaLabel: 'Clear memory',
  },
  {
    operation: 'MR',
    label: 'MR',
    ariaLabel: 'Recall memory',
  },
  {
    operation: 'M+',
    label: 'M+',
    ariaLabel: 'Add current value to memory',
  },
  {
    operation: 'M-',
    label: 'M-',
    ariaLabel: 'Subtract current value from memory',
  },
];

export function MemoryRegisterControls({
  currentValue,
  memory,
  onMemoryChange,
  onMemoryOperation,
  onOperationError,
  onRecallValue,
}: MemoryRegisterControlsProps) {
  const storedValue = memory.hasValue ? decimalToString(memory.value) : '0';

  function handleMemoryOperation(operation: MemoryOperation) {
    const operand = operation === 'M+' || operation === 'M-' ? currentValue : undefined;
    const result = applyMemoryOperation(operation, memory, operand);

    if (!result.ok) {
      onOperationError?.(result.error.message);
      return;
    }

    onMemoryChange(result.state);

    if (result.recalledValue) {
      onRecallValue?.(decimalToString(result.recalledValue));
    }
  }

  return (
    <section
      aria-label="Memory register controls"
      className="grid gap-2.5 rounded-[0.45rem] border border-amber-300/25 bg-amber-300/5 p-2.5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Register
        </span>
        <span className="max-w-36 truncate rounded border border-amber-300/30 bg-zinc-950/80 px-2 py-1 font-mono text-xs font-semibold text-amber-100">
          {storedValue}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {memoryButtons.map((button) => (
          <button
            aria-label={button.ariaLabel}
            className="min-h-10 rounded-[0.4rem] border border-amber-300/50 bg-zinc-950/80 px-2 text-sm font-semibold text-amber-100 tabular-nums transition hover:bg-amber-300/15 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            key={button.operation}
            onClick={() => (onMemoryOperation ?? handleMemoryOperation)(button.operation)}
            type="button"
          >
            {button.label}
          </button>
        ))}
      </div>
    </section>
  );
}

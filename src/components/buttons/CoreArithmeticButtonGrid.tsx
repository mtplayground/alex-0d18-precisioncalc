export type CoreArithmeticButtonValue =
  | 'clear'
  | 'divide'
  | 'multiply'
  | 'subtract'
  | 'add'
  | 'equals'
  | 'decimal'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

export interface CoreArithmeticButtonGridProps {
  onButtonPress?: (value: CoreArithmeticButtonValue) => void;
}

interface CoreArithmeticButton {
  value: CoreArithmeticButtonValue;
  label: string;
  ariaLabel: string;
  tone: 'number' | 'operator' | 'equals' | 'clear';
  className?: string;
}

const coreArithmeticButtons: CoreArithmeticButton[] = [
  {
    value: 'clear',
    label: 'C',
    ariaLabel: 'Clear',
    tone: 'clear',
  },
  {
    value: 'divide',
    label: '÷',
    ariaLabel: 'Divide',
    tone: 'operator',
  },
  {
    value: 'multiply',
    label: '×',
    ariaLabel: 'Multiply',
    tone: 'operator',
  },
  {
    value: 'subtract',
    label: '−',
    ariaLabel: 'Subtract',
    tone: 'operator',
  },
  {
    value: '7',
    label: '7',
    ariaLabel: 'Seven',
    tone: 'number',
  },
  {
    value: '8',
    label: '8',
    ariaLabel: 'Eight',
    tone: 'number',
  },
  {
    value: '9',
    label: '9',
    ariaLabel: 'Nine',
    tone: 'number',
  },
  {
    value: 'add',
    label: '+',
    ariaLabel: 'Add',
    tone: 'operator',
    className: 'row-span-2',
  },
  {
    value: '4',
    label: '4',
    ariaLabel: 'Four',
    tone: 'number',
  },
  {
    value: '5',
    label: '5',
    ariaLabel: 'Five',
    tone: 'number',
  },
  {
    value: '6',
    label: '6',
    ariaLabel: 'Six',
    tone: 'number',
  },
  {
    value: '1',
    label: '1',
    ariaLabel: 'One',
    tone: 'number',
  },
  {
    value: '2',
    label: '2',
    ariaLabel: 'Two',
    tone: 'number',
  },
  {
    value: '3',
    label: '3',
    ariaLabel: 'Three',
    tone: 'number',
  },
  {
    value: 'equals',
    label: '=',
    ariaLabel: 'Equals',
    tone: 'equals',
    className: 'row-span-2',
  },
  {
    value: '0',
    label: '0',
    ariaLabel: 'Zero',
    tone: 'number',
    className: 'col-span-2',
  },
  {
    value: 'decimal',
    label: '.',
    ariaLabel: 'Decimal point',
    tone: 'number',
  },
];

const toneClass: Record<CoreArithmeticButton['tone'], string> = {
  number: 'border-zinc-700 bg-zinc-800 text-white shadow-inner shadow-white/5 hover:bg-zinc-700',
  operator:
    'border-cyan-300/70 bg-cyan-300 text-zinc-950 shadow-inner shadow-white/30 hover:bg-cyan-200',
  equals:
    'border-emerald-300/80 bg-emerald-300 text-zinc-950 shadow-inner shadow-white/30 hover:bg-emerald-200',
  clear:
    'border-red-300/60 bg-red-300/15 text-red-100 shadow-inner shadow-red-200/10 hover:bg-red-300/25',
};

export function CoreArithmeticButtonGrid({ onButtonPress }: CoreArithmeticButtonGridProps) {
  return (
    <section
      aria-label="Core arithmetic buttons"
      className="grid h-full min-h-[24rem] grid-cols-4 grid-rows-[repeat(5,minmax(3.75rem,1fr))] gap-2.5"
    >
      {coreArithmeticButtons.map((button) => (
        <button
          aria-label={button.ariaLabel}
          className={`min-h-16 rounded-[0.45rem] border px-2 font-mono text-2xl font-semibold tabular-nums transition active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:text-3xl ${toneClass[button.tone]} ${
            button.className ?? ''
          }`}
          key={button.value}
          onClick={() => onButtonPress?.(button.value)}
          type="button"
        >
          {button.label}
        </button>
      ))}
    </section>
  );
}

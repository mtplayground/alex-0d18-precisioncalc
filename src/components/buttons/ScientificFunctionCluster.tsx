export type ScientificFunctionValue =
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'log'
  | 'ln'
  | 'pow2'
  | 'pow10'
  | 'pow'
  | 'exp'
  | 'sqrt'
  | 'cbrt'
  | 'root';

export interface ScientificFunctionClusterProps {
  onFunctionPress?: (value: ScientificFunctionValue) => void;
}

interface ScientificFunctionButton {
  value: ScientificFunctionValue;
  label: string;
  ariaLabel: string;
}

interface ScientificFunctionGroup {
  label: string;
  tone: 'trig' | 'log' | 'power' | 'root';
  buttons: ScientificFunctionButton[];
}

const scientificFunctionGroups: ScientificFunctionGroup[] = [
  {
    label: 'Trig',
    tone: 'trig',
    buttons: [
      { value: 'sin', label: 'sin', ariaLabel: 'Sine' },
      { value: 'cos', label: 'cos', ariaLabel: 'Cosine' },
      { value: 'tan', label: 'tan', ariaLabel: 'Tangent' },
      { value: 'asin', label: 'sin⁻¹', ariaLabel: 'Inverse sine' },
      { value: 'acos', label: 'cos⁻¹', ariaLabel: 'Inverse cosine' },
      { value: 'atan', label: 'tan⁻¹', ariaLabel: 'Inverse tangent' },
    ],
  },
  {
    label: 'Log',
    tone: 'log',
    buttons: [
      { value: 'log', label: 'log', ariaLabel: 'Base ten logarithm' },
      { value: 'ln', label: 'ln', ariaLabel: 'Natural logarithm' },
    ],
  },
  {
    label: 'Power',
    tone: 'power',
    buttons: [
      { value: 'pow2', label: 'x²', ariaLabel: 'Square' },
      { value: 'pow10', label: '10ˣ', ariaLabel: 'Ten to the power of x' },
      { value: 'pow', label: 'xʸ', ariaLabel: 'Power' },
      { value: 'exp', label: 'eˣ', ariaLabel: 'Exponential' },
    ],
  },
  {
    label: 'Root',
    tone: 'root',
    buttons: [
      { value: 'sqrt', label: '√x', ariaLabel: 'Square root' },
      { value: 'cbrt', label: '∛x', ariaLabel: 'Cube root' },
      { value: 'root', label: 'ʸ√x', ariaLabel: 'Nth root' },
    ],
  },
];

const groupToneClass: Record<ScientificFunctionGroup['tone'], string> = {
  trig: 'border-teal-300/25 bg-teal-300/5',
  log: 'border-sky-300/25 bg-sky-300/5',
  power: 'border-fuchsia-300/25 bg-fuchsia-300/5',
  root: 'border-lime-300/25 bg-lime-300/5',
};

const buttonToneClass: Record<ScientificFunctionGroup['tone'], string> = {
  trig: 'border-teal-300/40 text-teal-100 hover:bg-teal-300/15',
  log: 'border-sky-300/40 text-sky-100 hover:bg-sky-300/15',
  power: 'border-fuchsia-300/40 text-fuchsia-100 hover:bg-fuchsia-300/15',
  root: 'border-lime-300/40 text-lime-100 hover:bg-lime-300/15',
};

export function ScientificFunctionCluster({ onFunctionPress }: ScientificFunctionClusterProps) {
  return (
    <section aria-label="Scientific function buttons" className="grid gap-3">
      {scientificFunctionGroups.map((group) => (
        <section
          aria-label={`${group.label} functions`}
          className={`rounded-md border p-2 ${groupToneClass[group.tone]}`}
          key={group.label}
        >
          <h3 className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {group.buttons.map((button) => (
              <button
                aria-label={button.ariaLabel}
                className={`min-h-11 rounded-md border bg-zinc-950/80 px-2 font-mono text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${buttonToneClass[group.tone]}`}
                key={button.value}
                onClick={() => onFunctionPress?.(button.value)}
                type="button"
              >
                {button.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

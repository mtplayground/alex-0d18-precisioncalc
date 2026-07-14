import type { AngleMode, NotationMode } from '../../lib/storage';

export interface ModeToggleControlsProps {
  angleMode: AngleMode;
  notationMode: NotationMode;
  onAngleModeChange: (mode: AngleMode) => void;
  onNotationModeChange: (mode: NotationMode) => void;
}

const angleOptions: Array<{
  value: AngleMode;
  label: string;
  ariaLabel: string;
}> = [
  { value: 'deg', label: 'DEG', ariaLabel: 'Use degree mode' },
  { value: 'rad', label: 'RAD', ariaLabel: 'Use radian mode' },
];

const notationOptions: Array<{
  value: NotationMode;
  label: string;
  ariaLabel: string;
}> = [
  { value: 'standard', label: 'STD', ariaLabel: 'Use standard notation' },
  { value: 'scientific', label: 'SCI', ariaLabel: 'Use scientific notation' },
];

export function ModeToggleControls({
  angleMode,
  notationMode,
  onAngleModeChange,
  onNotationModeChange,
}: ModeToggleControlsProps) {
  return (
    <section
      aria-label="Calculator mode toggles"
      className="grid gap-2 rounded-[0.45rem] border border-white/10 bg-zinc-900 p-1.5 text-xs font-semibold text-zinc-300 shadow-inner shadow-white/5 sm:grid-cols-2"
    >
      <SegmentedControl
        ariaLabel="Angle mode"
        options={angleOptions}
        selectedValue={angleMode}
        onSelect={onAngleModeChange}
      />
      <SegmentedControl
        ariaLabel="Notation mode"
        options={notationOptions}
        selectedValue={notationMode}
        onSelect={onNotationModeChange}
      />
    </section>
  );
}

function SegmentedControl<TValue extends string>({
  ariaLabel,
  options,
  selectedValue,
  onSelect,
}: {
  ariaLabel: string;
  options: Array<{
    value: TValue;
    label: string;
    ariaLabel: string;
  }>;
  selectedValue: TValue;
  onSelect: (value: TValue) => void;
}) {
  return (
    <div aria-label={ariaLabel} className="grid grid-cols-2 gap-1" role="group">
      {options.map((option) => {
        const isSelected = option.value === selectedValue;

        return (
          <button
            aria-label={option.ariaLabel}
            aria-pressed={isSelected}
            className={`min-h-8 rounded-[0.35rem] px-2 py-1 transition active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
              isSelected
                ? 'bg-cyan-400 text-zinc-950 shadow-inner shadow-white/30'
                : 'text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
            key={option.value}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

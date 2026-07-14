export type PrimaryDisplayState = 'input' | 'pending' | 'result' | 'error';

export interface PrimaryDisplayProps {
  expression: string;
  result: string;
  pendingOperation?: string | null;
  state?: PrimaryDisplayState;
}

const stateLabel: Record<PrimaryDisplayState, string> = {
  input: 'Input',
  pending: 'Pending',
  result: 'Result',
  error: 'Error',
};

const stateTone: Record<PrimaryDisplayState, string> = {
  input: 'text-zinc-400',
  pending: 'text-amber-300',
  result: 'text-cyan-300',
  error: 'text-red-300',
};

export function PrimaryDisplay({
  expression,
  pendingOperation = null,
  result,
  state = 'input',
}: PrimaryDisplayProps) {
  const normalizedExpression = expression.trim();
  const normalizedResult = result.trim() || '0';

  return (
    <section
      aria-label="Primary calculator display"
      className="rounded-lg border border-white/10 bg-zinc-900 p-4 shadow-2xl shadow-black/30"
    >
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        <span>Display</span>
        <span className={stateTone[state]}>{stateLabel[state]}</span>
      </div>

      <div className="mt-4 grid min-h-24 content-end gap-3">
        <div className="min-h-6 overflow-hidden text-right font-mono text-sm text-zinc-400">
          {normalizedExpression ? (
            <span className="block truncate" title={normalizedExpression}>
              {normalizedExpression}
            </span>
          ) : (
            <span className="text-zinc-600">0</span>
          )}
        </div>

        <div
          aria-live="polite"
          className="overflow-x-auto text-right font-mono text-5xl font-semibold leading-tight text-white tabular-nums sm:text-6xl"
        >
          {normalizedResult}
        </div>
      </div>

      <div className="mt-3 flex min-h-5 items-center justify-end">
        {pendingOperation ? (
          <span className="rounded border border-amber-300/40 bg-amber-300/10 px-2 py-1 font-mono text-xs font-semibold text-amber-200">
            {pendingOperation}
          </span>
        ) : (
          <span className="text-xs font-medium text-zinc-600">No pending operation</span>
        )}
      </div>
    </section>
  );
}

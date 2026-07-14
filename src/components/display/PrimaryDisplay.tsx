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
      className="h-full min-h-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-2xl shadow-black/30 sm:p-4"
    >
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        <span>Display</span>
        <span className={stateTone[state]}>{stateLabel[state]}</span>
      </div>

      <div className="mt-2 grid min-h-0 content-end gap-2">
        <div className="min-h-5 overflow-hidden text-right font-mono text-sm text-zinc-400">
          {normalizedExpression ? (
            <span
              className="block truncate"
              data-testid="display-expression"
              title={normalizedExpression}
            >
              {normalizedExpression}
            </span>
          ) : (
            <span className="text-zinc-600" data-testid="display-expression">
              0
            </span>
          )}
        </div>

        <div
          aria-live="polite"
          className="overflow-x-auto text-right font-mono text-4xl font-semibold leading-tight text-white tabular-nums sm:text-6xl"
          data-testid="display-result"
        >
          {normalizedResult}
        </div>
      </div>

      <div className="mt-2 flex min-h-5 items-center justify-end">
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

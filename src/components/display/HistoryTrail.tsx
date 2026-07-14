export interface HistoryTrailEntry {
  id: string;
  expression: string;
  result: string;
  timestamp?: string;
}

export interface HistoryTrailProps {
  entries: HistoryTrailEntry[];
  maxVisible?: number;
  onRecallEntry?: (entry: HistoryTrailEntry) => void;
  onReuseResult?: (entry: HistoryTrailEntry) => void;
}

export function HistoryTrail({
  entries,
  maxVisible = 5,
  onRecallEntry,
  onReuseResult,
}: HistoryTrailProps) {
  const visibleEntries = entries.slice(0, maxVisible);

  return (
    <section
      aria-label="Calculation history trail"
      className="rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-2xl shadow-black/30"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">History</h2>
        <span className="text-xs font-medium text-zinc-500">{entries.length} entries</span>
      </div>

      {visibleEntries.length > 0 ? (
        <ol className="divide-y divide-white/10">
          {visibleEntries.map((entry) => (
            <li className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto]" key={entry.id}>
              <button
                aria-label={`Recall expression ${entry.expression}`}
                className="min-w-0 text-left font-mono text-sm text-zinc-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                onClick={() => onRecallEntry?.(entry)}
                type="button"
              >
                <span className="block truncate">{entry.expression}</span>
                {entry.timestamp ? (
                  <span className="mt-1 block text-xs font-medium text-zinc-600">
                    {entry.timestamp}
                  </span>
                ) : null}
              </button>

              <button
                aria-label={`Reuse result ${entry.result}`}
                className="justify-self-end rounded border border-cyan-300/40 bg-cyan-300/10 px-3 py-2 text-right font-mono text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                onClick={() => onReuseResult?.(entry)}
                type="button"
              >
                {entry.result}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="py-4 text-right font-mono text-sm text-zinc-600">0</div>
      )}
    </section>
  );
}

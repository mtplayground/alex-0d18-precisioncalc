const historyRows = ['12 x 4', '48 + 7', '55 / 5'];

const scientificZones = [
  ['sin', 'cos', 'tan', 'log'],
  ['ln', 'x^2', 'sqrt', 'x^y'],
];

const memoryZones = ['MC', 'MR', 'M+', 'M-'];

const keypadZones = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', 'x'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
];

export function AppShell() {
  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Scientific Calculator
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              Precision workbench
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded border border-white/10 bg-zinc-900 p-1 text-xs font-semibold text-zinc-300">
            <span className="rounded bg-cyan-400 px-2 py-1 text-zinc-950">DEG</span>
            <span className="px-2 py-1">RAD</span>
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid min-h-0 gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
            <section
              aria-label="Calculator display"
              className="rounded-lg border border-white/10 bg-zinc-900 p-4 shadow-2xl shadow-black/30"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <span>Display</span>
                <span>Ready</span>
              </div>
              <div className="mt-6 overflow-hidden text-right font-mono text-5xl font-semibold tabular-nums text-white sm:text-6xl">
                0
              </div>
              <div className="mt-3 truncate text-right font-mono text-sm text-zinc-500">
                awaiting input
              </div>
            </section>

            <section
              aria-label="Calculator controls"
              className="grid min-h-0 gap-4 lg:grid-cols-[minmax(15rem,0.85fr)_minmax(18rem,1.15fr)]"
            >
              <div className="grid gap-4">
                <ControlPanel title="Scientific">
                  <div className="grid grid-cols-4 gap-2">
                    {scientificZones.flat().map((label) => (
                      <ShellKey key={label} tone="secondary">
                        {label}
                      </ShellKey>
                    ))}
                  </div>
                </ControlPanel>

                <ControlPanel title="Memory">
                  <div className="grid grid-cols-4 gap-2">
                    {memoryZones.map((label) => (
                      <ShellKey key={label} tone="memory">
                        {label}
                      </ShellKey>
                    ))}
                  </div>
                </ControlPanel>
              </div>

              <ControlPanel title="Keypad">
                <div className="grid h-full min-h-72 grid-cols-4 gap-2">
                  {keypadZones.flat().map((label) => (
                    <ShellKey key={label} tone={isOperator(label) ? 'operator' : 'primary'}>
                      {label}
                    </ShellKey>
                  ))}
                </div>
              </ControlPanel>
            </section>
          </div>

          <aside
            aria-label="Calculation history"
            className="min-h-0 rounded-lg border border-white/10 bg-zinc-900 p-4 shadow-2xl shadow-black/30"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">
                History
              </h2>
              <span className="text-xs font-medium text-zinc-500">3 entries</span>
            </div>
            <ol className="mt-4 grid gap-3">
              {historyRows.map((expression, index) => (
                <li
                  className="rounded border border-white/10 bg-zinc-950 px-3 py-3 font-mono text-sm text-zinc-300"
                  key={expression}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{expression}</span>
                    <span className="text-zinc-500">#{historyRows.length - index}</span>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ControlPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900 p-3 shadow-2xl shadow-black/30">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ShellKey({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'primary' | 'secondary' | 'operator' | 'memory';
}) {
  const toneClass = {
    primary: 'border-zinc-700 bg-zinc-800 text-white',
    secondary: 'border-zinc-700 bg-zinc-950 text-zinc-200',
    operator: 'border-cyan-300/60 bg-cyan-300 text-zinc-950',
    memory: 'border-amber-300/50 bg-amber-300/15 text-amber-100',
  }[tone];

  return (
    <button
      className={`min-h-12 rounded-md border px-2 text-sm font-semibold tabular-nums transition ${toneClass}`}
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function isOperator(label: string) {
  return ['/', 'x', '-', '+', '='].includes(label);
}

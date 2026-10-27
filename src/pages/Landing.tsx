import { Link } from 'react-router-dom';
import { Layers, Clock, BarChart3, Music2, RefreshCw, LayoutGrid } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { usePageTitle } from '@/hooks/usePageTitle';

const HEAT_SHADES = [
  'var(--bg-tertiary)',
  'color-mix(in srgb, var(--color-brand) 25%, transparent)',
  'color-mix(in srgb, var(--color-brand) 45%, transparent)',
  'color-mix(in srgb, var(--color-brand) 70%, transparent)',
  'var(--color-brand)',
];

// Deterministic pseudo-random pattern so the illustration is stable between renders.
const HEAT_CELLS = Array.from({ length: 140 }, (_, i) => {
  const row = Math.floor(i / 20);
  const col = i % 20;
  const chance = Math.max(0, 1 - (Math.abs(row - 3.5) + Math.abs(col - 10)) * 0.08);
  const r = (Math.sin(i * 12.9898) * 43758.5453) % 1;
  const v = Math.abs(r);
  if (v < chance * 0.3) return 4;
  if (v < chance * 0.5) return 3;
  if (v < chance * 0.7) return 2;
  if (v < chance * 0.9) return 1;
  return 0;
});

function HeatmapMock() {
  return (
    <div className="mt-8 grid max-w-[400px] grid-cols-20 gap-[3px]" aria-hidden="true">
      {HEAT_CELLS.map((level, i) => (
        <div
          key={i}
          className="aspect-square rounded-[3px]"
          style={{ background: HEAT_SHADES[level] }}
        />
      ))}
    </div>
  );
}

const cta =
  'inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-solid px-7 text-md font-semibold text-white transition-opacity hover:opacity-90';

export function LandingPage() {
  usePageTitle('');
  return (
    <div className="min-h-[100dvh] bg-bg-primary text-text-base">
      <header className="safe-top safe-x fixed left-0 right-0 top-0 z-50 bg-bg-primary/85 backdrop-blur-md">
        <nav aria-label="Main" className="flex h-16 items-center justify-between px-4 sm:px-8">
          <Link to="/" aria-label="ClockWise home">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-6">
            <a
              href="#features"
              className="hidden sm:block text-sm font-medium text-text-sub hover:text-text-base transition-colors"
            >
              Features
            </a>
            <a
              href="#stats"
              className="hidden sm:block text-sm font-medium text-text-sub hover:text-text-base transition-colors"
            >
              Analytics
            </a>
            <Link
              to="/login"
              className="flex min-h-11 items-center px-3 text-sm font-semibold text-text-base hover:underline"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="flex min-h-11 items-center rounded-lg bg-brand-solid px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 pb-16 pt-[calc(7rem+env(safe-area-inset-top))] text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-base text-xs font-semibold text-text-sub mb-8">
            <span className="w-2 h-2 rounded-full bg-brand" />
            Free &middot; No ads &middot; Works offline
          </div>

          <h1 className="font-display font-black italic text-[clamp(64px,12vw,140px)] leading-[0.9] tracking-tight mb-6">
            Clock
            <br />
            <span className="text-brand">Wise</span>
          </h1>

          <p className="mb-10 max-w-md text-md leading-relaxed text-text-sub">
            A calm Pomodoro timer that logs every session to your projects, so you can see where
            your time really goes. Install it on your phone and it works like a native app.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-16">
            <Link to="/signup" className={cta}>
              Get started free <span aria-hidden="true">&rarr;</span>
            </Link>
            <a
              href="#features"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border-input px-7 text-md font-semibold text-text-base transition-colors hover:bg-bg-secondary"
            >
              See features
            </a>
          </div>

          {/* Timer mock */}
          <div
            aria-hidden="true"
            className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border-base bg-bg-card px-6 py-10 shadow-elevated sm:px-16 sm:py-12"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-brand-text">
              Focus time
            </span>
            <div className="font-display text-[clamp(56px,16vw,120px)] font-black italic leading-none tracking-tight tabular-nums">
              25<span className="mx-2 text-brand">:</span>00
            </div>
            <span className="rounded-full bg-brand-solid px-3 py-1 text-xs font-semibold text-white">
              Phase 1 of 8
            </span>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="pt-20 pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display font-bold text-[clamp(32px,5vw,48px)] leading-tight tracking-tight mb-4">
                Everything you need.
                <br />
                Nothing you don&apos;t.
              </h2>
              <p className="max-w-lg mx-auto text-md text-text-sub">
                Built for people who want to focus, not manage software.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 border border-border-base rounded-2xl overflow-hidden">
              {[
                {
                  icon: <Clock className="w-5 h-5" />,
                  title: 'A timer you can trust',
                  desc: 'Keeps time even when your phone locks or the app is closed. Digital, dial and clock faces, plus keyboard shortcuts.',
                },
                {
                  icon: <LayoutGrid className="w-5 h-5" />,
                  title: 'Projects and tasks',
                  desc: 'Pick what you’re working on and every session is logged to it automatically. Add time you tracked elsewhere, too.',
                },
                {
                  icon: <Layers className="w-5 h-5" />,
                  title: 'Templates',
                  desc: 'Switch between Classic Pomodoro, Deep Work, Quick Sprint or your own setups in one tap.',
                },
                {
                  icon: <Music2 className="w-5 h-5" />,
                  title: 'Sound to focus by',
                  desc: 'Lofi radio stations plus rain, café murmur, white and brown noise generated right in your browser.',
                },
                {
                  icon: <BarChart3 className="w-5 h-5" />,
                  title: 'Honest analytics',
                  desc: 'Heatmaps, trends, streaks and a weekly goal — with like-for-like comparisons, so a Tuesday never looks like a bad week.',
                },
                {
                  icon: <RefreshCw className="w-5 h-5" />,
                  title: 'Sync and offline',
                  desc: 'Works without a connection and syncs when you’re back. Export everything to JSON or CSV any time.',
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="p-10 bg-bg-card border-b border-r border-border-base last:border-r-0 md:[&:nth-child(3)]:border-r-0 md:[&:nth-child(4)]:border-b-0 md:[&:nth-child(5)]:border-b-0 md:[&:nth-child(6)]:border-b-0"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-secondary border border-border-base mb-5 text-text-sub">
                    {f.icon}
                  </div>
                  <h3 className="text-md font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-text-sub leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats preview */}
        <section id="stats" className="py-24 px-6 bg-bg-secondary">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="font-display font-bold text-[clamp(28px,4vw,40px)] leading-tight tracking-tight mb-4">
                See where your
                <br />
                time actually goes.
              </h2>
              <p className="max-w-sm text-md text-text-sub mb-8">
                Daily heatmaps, trend lines, project breakdowns, and streak tracking. No guessing
                &mdash; just data.
              </p>
              <Link to="/signup" className={cta}>
                Start tracking <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <div>
              <div
                aria-hidden="true"
                className="grid grid-cols-2 border border-border-base rounded-2xl overflow-hidden"
              >
                {[
                  { label: 'Today', value: '2h 14m', delta: '▲ 18% vs yesterday' },
                  { label: 'This week', value: '14h 32m', delta: '▲ 7% vs last week' },
                  { label: 'Sessions', value: '18', delta: '94% finished' },
                  { label: 'Streak', value: '12 days', delta: 'Personal best' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="p-5 sm:p-7 bg-bg-card border-b border-r border-border-base [&:nth-child(2)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 [&:nth-child(4)]:border-r-0"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                      {s.label}
                    </div>
                    <div className="font-display text-3xl font-bold leading-none sm:text-4xl">
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-success-text">{s.delta}</div>
                  </div>
                ))}
              </div>
              <HeatmapMock />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 text-center">
          <h2 className="font-display font-black italic text-[clamp(40px,8vw,80px)] leading-[0.95] tracking-tight mb-6">
            Stop planning.
            <br />
            <span className="text-brand">Start doing.</span>
          </h2>
          <p className="mx-auto mb-10 max-w-md text-md text-text-sub">
            Create a free account and start your first focus session in under a minute.
          </p>
          <Link to="/signup" className={cta}>
            Get started free <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>
      </main>

      <footer className="safe-bottom flex flex-col items-center gap-2 px-6 py-8 text-center text-sm text-text-sub">
        <Logo size="sm" />
        <span>Free and ad-free. Your data is yours — export it any time.</span>
      </footer>
    </div>
  );
}

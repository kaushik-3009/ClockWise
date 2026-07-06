import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, BarChart3, Cloud, Zap, LayoutGrid } from 'lucide-react';

function HeatmapMock() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    for (let i = 0; i < 140; i++) {
      const cell = document.createElement('div');
      cell.className = 'rounded-[3px] aspect-square';
      const row = Math.floor(i / 20);
      const col = i % 20;
      const dist = Math.abs(row - 3.5) + Math.abs(col - 10);
      const chance = Math.max(0, 1 - dist * 0.08);
      const r = Math.random();
      if (r < chance * 0.3) cell.style.background = 'var(--color-brand)';
      else if (r < chance * 0.5)
        cell.style.background = 'color-mix(in srgb, var(--color-brand) 70%, transparent)';
      else if (r < chance * 0.7)
        cell.style.background = 'color-mix(in srgb, var(--color-brand) 45%, transparent)';
      else if (r < chance * 0.9)
        cell.style.background = 'color-mix(in srgb, var(--color-brand) 25%, transparent)';
      else cell.style.background = 'var(--bg-tertiary)';
      ref.current.appendChild(cell);
    }
  }, []);
  return <div ref={ref} className="grid grid-cols-20 gap-[3px] mt-8 max-w-[400px]" />;
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-base">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-6 sm:px-8 bg-bg-primary/80 backdrop-blur-md">
        <Link to="/" className="font-display font-black italic text-2xl text-brand tracking-tight">
          ClockWise
        </Link>
        <div className="flex items-center gap-6">
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
            to="/timer"
            className="px-5 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition-colors"
          >
            Open App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-base text-xs font-semibold text-text-sub mb-8">
          <span className="w-2 h-2 rounded-full bg-brand" />
          Open source &middot; Synced across devices
        </div>

        <h1 className="font-display font-black italic text-[clamp(64px,12vw,140px)] leading-[0.9] tracking-tight mb-6">
          Clock
          <br />
          <span className="text-brand">Wise</span>
        </h1>

        <p className="max-w-md text-base text-text-sub leading-relaxed mb-10">
          A minimal Pomodoro timer with project tracking and analytics. Sign in to sync your data
          across devices. No distractions, just focus.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-16">
          <Link
            to="/timer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand text-white text-[15px] font-semibold rounded-xl hover:bg-brand-hover transition-colors"
          >
            Start Focusing <span>&rarr;</span>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-border-base text-text-base text-[15px] font-semibold rounded-xl hover:bg-bg-secondary transition-colors"
          >
            See Features
          </a>
        </div>

        {/* Timer mock */}
        <div className="flex flex-col items-center gap-4 px-16 py-12 bg-bg-card border border-border-base rounded-2xl shadow-lg">
          <span className="text-xs font-bold tracking-widest uppercase text-brand">Focus Time</span>
          <div className="font-display font-black italic text-[clamp(56px,10vw,120px)] leading-none tabular-nums tracking-tight">
            24<span className="text-brand mx-2">:</span>59
          </div>
          <span className="px-3 py-1 rounded-full bg-brand text-white text-xs font-semibold">
            Phase 1 of 8
          </span>
          <div className="flex gap-3 mt-2">
            {['\u25B6', '\u21BB', '\u23ED'].map((icon, i) => (
              <span
                key={i}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-border-base text-text-sub text-sm"
              >
                {icon}
              </span>
            ))}
          </div>
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
            <p className="max-w-lg mx-auto text-[15px] text-text-sub">
              Built for people who want to focus, not manage software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-border-base rounded-2xl overflow-hidden">
            {[
              {
                icon: <Clock className="w-5 h-5" />,
                title: 'Pomodoro Timer',
                desc: 'Configurable focus and break phases. Digital, analog, and clock display modes. Keyboard shortcuts for everything.',
              },
              {
                icon: <LayoutGrid className="w-5 h-5" />,
                title: 'Project Tracking',
                desc: 'Organize work into color-coded projects with tasks. Every second is automatically logged to the right project.',
              },
              {
                icon: <Flame className="w-5 h-5" />,
                title: 'Templates',
                desc: 'Save timer configurations as templates. Switch between Classic Pomodoro, Deep Work, Quick Sprint, and more.',
              },
              {
                icon: <Cloud className="w-5 h-5" />,
                title: 'Ambient Sounds',
                desc: 'Rain, white noise, brown noise, and cafe background audio. Generated via Web Audio API \u2014 no downloads.',
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: 'Analytics Dashboard',
                desc: 'Heatmaps, trend charts, session breakdowns, streak tracking, and weekly goals. See where your time goes.',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: 'Cloud Sync',
                desc: 'Your data syncs instantly via Firebase. Sign in from any device to pick up where you left off.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-10 bg-bg-card border-b border-r border-border-base last:border-r-0 md:[&:nth-child(3)]:border-r-0 md:[&:nth-child(4)]:border-b-0 md:[&:nth-child(5)]:border-b-0 md:[&:nth-child(6)]:border-b-0"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-secondary border border-border-base mb-5 text-text-sub">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold mb-2">{f.title}</h3>
                <p className="text-[13px] text-text-sub leading-relaxed">{f.desc}</p>
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
            <p className="max-w-sm text-[15px] text-text-sub mb-8">
              Daily heatmaps, trend lines, project breakdowns, and streak tracking. No guessing
              &mdash; just data.
            </p>
            <Link
              to="/timer"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand text-white text-[15px] font-semibold rounded-xl hover:bg-brand-hover transition-colors"
            >
              View Your Stats &rarr;
            </Link>
          </div>

          <div>
            <div className="grid grid-cols-2 border border-border-base rounded-2xl overflow-hidden">
              {[
                { label: 'Today', value: '2h 14m', delta: '+18% vs avg' },
                { label: 'This Week', value: '14h 32m', delta: '+7% vs last week' },
                { label: 'Sessions', value: '18', delta: '94% completed' },
                { label: 'Streak', value: '12 days', delta: 'Personal best!' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-7 bg-bg-card border-b border-r border-border-base [&:nth-child(2)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 [&:nth-child(4)]:border-r-0"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                    {s.label}
                  </div>
                  <div className="font-display font-bold text-[36px] leading-none">{s.value}</div>
                  <div className="text-[11px] font-semibold text-success mt-1">{s.delta}</div>
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
        <p className="max-w-md mx-auto text-base text-text-sub mb-10">
          Create a free account and start your first focus session right now.
        </p>
        <Link
          to="/timer"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand text-white text-[15px] font-semibold rounded-xl hover:bg-brand-hover transition-colors"
        >
          Open ClockWise &rarr;
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-[13px] text-text-muted">
        ClockWise &middot; Built with React, TypeScript &amp; Firebase
      </footer>
    </div>
  );
}

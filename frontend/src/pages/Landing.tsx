import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FloatingBackground } from '../components/landing/FloatingBackground';
import { Counter } from '../components/landing/Counter';
import { Reveal, TextReveal } from '../components/landing/Reveal';
import { MagneticButton, SpotlightCard } from '../components/landing/Interactive';
import { useScrollY } from '../lib/useReveal';

const FEATURES = [
  {
    icon: '🎓',
    title: 'Student Lifecycle',
    body: 'Admissions, departments, courses and semesters in one record that stays current from enrolment to graduation.',
  },
  {
    icon: '🗓️',
    title: 'Smart Timetables',
    body: 'Build clash-free schedules per course and section, and publish them to faculty and students instantly.',
  },
  {
    icon: '✅',
    title: 'Attendance Tracking',
    body: 'Faculty mark a period in seconds; students see live percentages and shortfall warnings on their dashboard.',
  },
  {
    icon: '📊',
    title: 'Exams & Results',
    body: 'Internal and end-semester marks roll up into grade sheets with automatic aggregates and pass criteria.',
  },
  {
    icon: '💳',
    title: 'Fees & Receipts',
    body: 'Structure-wise dues, part payments and outstanding balances tracked with a full transaction history.',
  },
  {
    icon: '📝',
    title: 'Leave Workflow',
    body: 'Students and faculty raise leave requests; approvers act on them from a single review queue.',
  },
];

const STATS: { value: number; suffix: string; label: string; decimals?: number }[] = [
  { value: 12500, suffix: '+', label: 'Students managed' },
  { value: 640, suffix: '', label: 'Faculty accounts' },
  { value: 99.9, decimals: 1, suffix: '%', label: 'Uptime this year' },
  { value: 45, suffix: 'k', label: 'Records processed daily' },
];

const STEPS = [
  { n: '01', title: 'Set up your institute', body: 'Departments, courses, subjects and semesters — configured once by the administrator.' },
  { n: '02', title: 'Onboard people', body: 'Import students and faculty, allocate subjects, and roles unlock the right portal automatically.' },
  { n: '03', title: 'Run the semester', body: 'Attendance, exams, fees and leaves flow through the same system all term long.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const scrollY = useScrollY();

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#05070f';
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen text-slate-200 selection:bg-brand-400/30">
      <FloatingBackground />

      <div className="relative">
        {/* ---------------- nav ---------------- */}
        <header
          className={`sticky top-0 z-40 transition-all duration-500 ${
            scrollY > 24 ? 'border-b border-white/10 bg-[#05070f]/70 backdrop-blur-xl' : 'border-b border-transparent'
          }`}
        >
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <span className="flex items-center gap-2 text-sm font-semibold tracking-widest text-white">
              <span className="inline-block h-2.5 w-2.5 animate-pulse-glow rounded-full bg-brand-400" />
              STUDENT ERP
            </span>
            <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
              {[
                ['Features', 'features'],
                ['Impact', 'stats'],
                ['How it works', 'how'],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="group relative py-1 transition-colors hover:text-white"
                >
                  {label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-brand-400 transition-transform duration-300 group-hover:scale-x-100" />
                </button>
              ))}
            </div>
            <MagneticButton onClick={() => navigate('/login')} className="!px-5 !py-2 text-xs" strength={0.2}>
              Sign in
            </MagneticButton>
          </nav>
        </header>

        {/* ---------------- hero ---------------- */}
        <section className="mx-auto max-w-6xl px-6 pb-28 pt-24 md:pt-32">
          <div
            style={{
              transform: `translate3d(0, ${scrollY * 0.16}px, 0)`,
              opacity: Math.max(0, 1 - scrollY / 620),
            }}
          >
            <Reveal direction="down" duration={900}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-slate-300 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-emerald-400" />
                Now live for the 2026 academic session
              </span>
            </Reveal>

            <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl">
              <TextReveal text="Run your entire campus" delay={120} />
              <br />
              <TextReveal
                text="from one quiet system."
                delay={420}
                wordClassName="bg-gradient-to-r from-brand-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent"
              />
            </h1>

            <Reveal delay={900} className="mt-7 max-w-xl">
              <p className="text-lg leading-relaxed text-slate-400">
                Admissions, timetables, attendance, examinations, fees and leave — one record for every
                student, one dashboard for every role.
              </p>
            </Reveal>

            <Reveal delay={1080} className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <MagneticButton onClick={() => navigate('/login')}>
                  Open the portal
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </MagneticButton>
                <MagneticButton variant="ghost" onClick={() => scrollTo('features')}>
                  Explore features
                </MagneticButton>
              </div>
            </Reveal>

            <Reveal delay={1240} className="mt-14">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Admin</span>
                <span className="h-px w-8 bg-slate-700" />
                <span>Faculty</span>
                <span className="h-px w-8 bg-slate-700" />
                <span>Student</span>
                <span className="h-px w-8 bg-slate-700" />
                <span>Role-aware dashboards</span>
              </div>
            </Reveal>
          </div>

          {/* floating preview panel */}
          <Reveal direction="scale" delay={200} duration={1000} className="mt-20">
            <div className="animate-float-slow rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_40px_120px_-40px_rgba(55,95,245,0.6)] backdrop-blur">
              <div className="rounded-2xl border border-white/5 bg-[#080b16] p-6">
                <div className="flex items-center gap-2 pb-5">
                  {['bg-rose-400/70', 'bg-amber-400/70', 'bg-emerald-400/70'].map((c) => (
                    <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />
                  ))}
                  <span className="ml-3 text-xs text-slate-500">student-erp / admin / dashboard</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { k: 'Attendance today', v: '92.4%', d: '+1.8%' },
                    { k: 'Fees collected', v: '₹18.2L', d: '+₹42k' },
                    { k: 'Pending leaves', v: '7', d: '−3' },
                  ].map((tile, i) => (
                    <div
                      key={tile.k}
                      className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:bg-white/[0.05]"
                      style={{ animationDelay: `${i * 200}ms` }}
                    >
                      <p className="text-xs text-slate-500">{tile.k}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{tile.v}</p>
                      <p className="mt-1 text-xs text-emerald-400">{tile.d} vs last week</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex h-24 items-end gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  {[38, 55, 42, 68, 51, 74, 62, 88, 70, 95, 81, 100].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-brand-600/40 to-brand-300 transition-all duration-300 hover:from-fuchsia-500/50 hover:to-fuchsia-300"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------------- features ---------------- */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-300">Modules</p>
          </Reveal>
          <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            <TextReveal text="Everything an institute repeats every single term." stagger={55} />
          </h2>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <SpotlightCard className="h-full">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
                    {f.icon}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-300 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    Learn more <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------- stats ---------------- */}
        <section id="stats" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] py-20 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 120} direction="scale">
                <div className="group text-center">
                  <p className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-bold text-transparent transition-transform duration-300 group-hover:scale-110">
                    <Counter value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
                  </p>
                  <p className="mt-3 text-sm text-slate-400">{s.label}</p>
                  <span className="mx-auto mt-4 block h-px w-10 origin-center scale-x-0 bg-brand-400 transition-transform duration-500 group-hover:scale-x-[3]" />
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------- how it works ---------------- */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-300">How it works</p>
          </Reveal>
          <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            <TextReveal text="Three steps to a live campus." stagger={60} />
          </h2>

          <ol className="mt-14 space-y-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} direction="left" delay={i * 140} as="li">
                <div className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:bg-white/[0.05] md:flex-row md:items-center md:gap-10">
                  <span className="text-4xl font-bold text-white/15 transition-colors duration-300 group-hover:text-brand-400/60">
                    {step.n}
                  </span>
                  <div className="md:flex-1">
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-400">{step.body}</p>
                  </div>
                  <span className="text-2xl text-slate-600 transition-all duration-300 group-hover:translate-x-2 group-hover:text-brand-300">
                    →
                  </span>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ---------------- cta ---------------- */}
        <section className="mx-auto max-w-6xl px-6 pb-28">
          <Reveal direction="scale" duration={900}>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-600/25 via-white/[0.03] to-fuchsia-600/15 px-8 py-16 text-center backdrop-blur">
              <div className="absolute -left-16 -top-16 h-56 w-56 animate-drift rounded-full bg-brand-500/25 blur-3xl" />
              <div className="absolute -bottom-20 -right-10 h-64 w-64 animate-drift rounded-full bg-fuchsia-500/20 blur-3xl [animation-delay:-8s]" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  <TextReveal text="Ready when your semester is." stagger={60} />
                </h2>
                <p className="mx-auto mt-4 max-w-md text-slate-400">
                  Sign in with your institute credentials — the portal opens straight to your role.
                </p>
                <div className="mt-9 flex justify-center">
                  <MagneticButton onClick={() => navigate('/login')}>
                    Sign in to the portal
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------------- footer ---------------- */}
        <footer className="border-t border-white/10 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 sm:flex-row">
            <span>© {new Date().getFullYear()} Student ERP</span>
            <span className="flex gap-6">
              {['Admin', 'Faculty', 'Student'].map((r) => (
                <button key={r} onClick={() => navigate('/login')} className="transition-colors hover:text-white">
                  {r} portal
                </button>
              ))}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

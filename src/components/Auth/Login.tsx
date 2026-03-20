import { useState } from 'react';

interface Props {
  onLogin: (firstName: string, lastName: string, wardCode: string) => void;
  onSignup: (trustName: string, unitName: string, wardName: string, managerEmail: string, password: string) => string;
}

export default function Login({ onLogin, onSignup }: Props) {
  // Sign In state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [wardCode, setWardCode] = useState('');

  // Sign Up state
  const [trustName, setTrustName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [wardName, setWardName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Modal visibility
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(firstName, lastName, wardCode);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = onSignup(trustName, unitName, wardName, managerEmail, password);
    setGeneratedCode(code);
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center overflow-hidden bg-white">
      {/* ECG line background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.06]">
        <svg
          viewBox="0 0 2400 200"
          className="absolute w-[300%] max-w-none"
          preserveAspectRatio="none"
          style={{ animation: 'ecg-scroll 8s linear infinite' }}
        >
          <path
            d="M0,100 L80,100 L100,100 L110,90 L120,100 L160,100 L175,100 L180,60 L185,160 L190,30 L195,140 L200,100 L220,100 L240,95 L260,100 L300,100
               M300,100 L380,100 L400,100 L410,90 L420,100 L460,100 L475,100 L480,60 L485,160 L490,30 L495,140 L500,100 L520,100 L540,95 L560,100 L600,100
               M600,100 L680,100 L700,100 L710,90 L720,100 L760,100 L775,100 L780,60 L785,160 L790,30 L795,140 L800,100 L820,100 L840,95 L860,100 L900,100
               M900,100 L980,100 L1000,100 L1010,90 L1020,100 L1060,100 L1075,100 L1080,60 L1085,160 L1090,30 L1095,140 L1100,100 L1120,100 L1140,95 L1160,100 L1200,100
               M1200,100 L1280,100 L1300,100 L1310,90 L1320,100 L1360,100 L1375,100 L1380,60 L1385,160 L1390,30 L1395,140 L1400,100 L1420,100 L1440,95 L1460,100 L1500,100
               M1500,100 L1580,100 L1600,100 L1610,90 L1620,100 L1660,100 L1675,100 L1680,60 L1685,160 L1690,30 L1695,140 L1700,100 L1720,100 L1740,95 L1760,100 L1800,100
               M1800,100 L1880,100 L1900,100 L1910,90 L1920,100 L1960,100 L1975,100 L1980,60 L1985,160 L1990,30 L1995,140 L2000,100 L2020,100 L2040,95 L2060,100 L2100,100
               M2100,100 L2180,100 L2200,100 L2210,90 L2220,100 L2260,100 L2275,100 L2280,60 L2285,160 L2290,30 L2295,140 L2300,100 L2320,100 L2340,95 L2360,100 L2400,100"
            fill="none"
            stroke="#0B1E36"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Secondary ECG line offset */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.03]" style={{ transform: 'translateY(-80px)' }}>
        <svg
          viewBox="0 0 2400 200"
          className="absolute w-[300%] max-w-none"
          preserveAspectRatio="none"
          style={{ animation: 'ecg-scroll 12s linear infinite' }}
        >
          <path
            d="M0,100 L80,100 L100,100 L110,90 L120,100 L160,100 L175,100 L180,60 L185,160 L190,30 L195,140 L200,100 L220,100 L240,95 L260,100 L300,100
               M300,100 L380,100 L400,100 L410,90 L420,100 L460,100 L475,100 L480,60 L485,160 L490,30 L495,140 L500,100 L520,100 L540,95 L560,100 L600,100
               M600,100 L680,100 L700,100 L710,90 L720,100 L760,100 L775,100 L780,60 L785,160 L790,30 L795,140 L800,100 L820,100 L840,95 L860,100 L900,100
               M900,100 L980,100 L1000,100 L1010,90 L1020,100 L1060,100 L1075,100 L1080,60 L1085,160 L1090,30 L1095,140 L1100,100 L1120,100 L1140,95 L1160,100 L1200,100
               M1200,100 L1280,100 L1300,100 L1310,90 L1320,100 L1360,100 L1375,100 L1380,60 L1385,160 L1390,30 L1395,140 L1400,100 L1420,100 L1440,95 L1460,100 L1500,100
               M1500,100 L1580,100 L1600,100 L1610,90 L1620,100 L1660,100 L1675,100 L1680,60 L1685,160 L1690,30 L1695,140 L1700,100 L1720,100 L1740,95 L1760,100 L1800,100
               M1800,100 L1880,100 L1900,100 L1910,90 L1920,100 L1960,100 L1975,100 L1980,60 L1985,160 L1990,30 L1995,140 L2000,100 L2020,100 L2040,95 L2060,100 L2100,100
               M2100,100 L2180,100 L2200,100 L2210,90 L2220,100 L2260,100 L2275,100 L2280,60 L2285,160 L2290,30 L2295,140 L2300,100 L2320,100 L2340,95 L2360,100 L2400,100"
            fill="none"
            stroke="#00AEEF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Third ECG line */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.03]" style={{ transform: 'translateY(80px)' }}>
        <svg
          viewBox="0 0 2400 200"
          className="absolute w-[300%] max-w-none"
          preserveAspectRatio="none"
          style={{ animation: 'ecg-scroll 15s linear infinite reverse' }}
        >
          <path
            d="M0,100 L80,100 L100,100 L110,90 L120,100 L160,100 L175,100 L180,60 L185,160 L190,30 L195,140 L200,100 L220,100 L240,95 L260,100 L300,100
               M300,100 L380,100 L400,100 L410,90 L420,100 L460,100 L475,100 L480,60 L485,160 L490,30 L495,140 L500,100 L520,100 L540,95 L560,100 L600,100
               M600,100 L680,100 L700,100 L710,90 L720,100 L760,100 L775,100 L780,60 L785,160 L790,30 L795,140 L800,100 L820,100 L840,95 L860,100 L900,100
               M900,100 L980,100 L1000,100 L1010,90 L1020,100 L1060,100 L1075,100 L1080,60 L1085,160 L1090,30 L1095,140 L1100,100 L1120,100 L1140,95 L1160,100 L1200,100
               M1200,100 L1280,100 L1300,100 L1310,90 L1320,100 L1360,100 L1375,100 L1380,60 L1385,160 L1390,30 L1395,140 L1400,100 L1420,100 L1440,95 L1460,100 L1500,100
               M1500,100 L1580,100 L1600,100 L1610,90 L1620,100 L1660,100 L1675,100 L1680,60 L1685,160 L1690,30 L1695,140 L1700,100 L1720,100 L1740,95 L1760,100 L1800,100
               M1800,100 L1880,100 L1900,100 L1910,90 L1920,100 L1960,100 L1975,100 L1980,60 L1985,160 L1990,30 L1995,140 L2000,100 L2020,100 L2040,95 L2060,100 L2100,100
               M2100,100 L2180,100 L2200,100 L2210,90 L2220,100 L2260,100 L2275,100 L2280,60 L2285,160 L2290,30 L2295,140 L2300,100 L2320,100 L2340,95 L2360,100 L2400,100"
            fill="none"
            stroke="#0B1E36"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ─── Floating Pill Header ─── */}
      <header className="sticky top-3 z-50 w-full max-w-4xl px-3 pt-3">
        <div className="flex h-14 items-center justify-between rounded-full bg-slate-900 pr-2.5 pl-2.5 ring-1 ring-white/10">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <div className="flex h-9 w-9 items-center justify-center">
              <svg className="h-7 w-7 text-[#00AEEF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-white">
              NEWS<span className="text-[#00AEEF]">2</span>
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#" className="font-sans transition hover:text-white">Product</a>
            <a href="#" className="font-sans transition hover:text-white">Features</a>
            <button onClick={() => setShowPricing(true)} className="font-sans transition hover:text-white">Pricing</button>
            <a href="#" className="font-sans transition hover:text-white">Contact</a>
          </nav>

          {/* CTA buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => setShowLogin(true)}
              className="rounded-md px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className="relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-r from-white/10 to-white/5 px-6 text-sm font-medium text-white/90 shadow-lg backdrop-blur-xl transition-all duration-300 hover:from-white/15 hover:to-white/10"
              style={{
                boxShadow: '0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.08), inset 1px 1px 1px -0.5px rgba(255,255,255,0.3), inset -1px -1px 1px -0.5px rgba(255,255,255,0.15), inset 0 0 6px 6px rgba(255,255,255,0.05)',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Mobile menu */}
          <button className="inline-flex items-center justify-center rounded-md p-2 hover:bg-white/5 md:hidden">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16" /><path d="M4 18h16" /><path d="M4 6h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── Hero Content ─── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          NHS Early Warning Score System
        </div>

        <h1 className="mb-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[#0B1E36] sm:text-4xl md:text-5xl lg:text-6xl">
          Precision Monitoring.{' '}
          <span className="text-[#00AEEF]">Better Outcomes.</span>
        </h1>

        <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-500 lg:text-lg">
          Digitise your ward's NEWS2 observations with real-time scoring,
          visual trend charts, and instant clinical escalation alerts.
        </p>

        {/* Feature pills */}
        <div className="mb-8 flex flex-wrap justify-center gap-2 sm:mb-10 sm:gap-3">
          {[
            { icon: '📊', text: 'Live NEWS2 Scoring' },
            { icon: '📈', text: 'Visual Trend Charts' },
            { icon: '🔔', text: 'Escalation Alerts' },
            { icon: '🔒', text: 'Ward-Level Security' },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-[#00AEEF]/30 hover:shadow-md"
            >
              <span>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={() => setShowLogin(true)}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0B1E36] px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/20 sm:w-auto"
          >
            Sign In to Ward
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setShowSignup(true)}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:w-auto"
          >
            Register Ward
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="relative z-10 flex w-full items-center justify-between px-4 py-4 text-xs text-slate-400 sm:px-8">
        <p>Not a certified medical device. Follow local trust policies.</p>
        <div className="hidden items-center gap-6 md:flex">
          <a href="#" className="transition hover:text-slate-600">Privacy</a>
          <a href="#" className="transition hover:text-slate-600">Terms</a>
        </div>
      </div>

      {/* ─── Pricing Modal ─── */}
      {showPricing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowPricing(false)}
        >
          <div
            className="relative mx-3 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl sm:mx-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPricing(false)}
              className="absolute top-4 right-4 text-slate-300 transition-colors hover:text-slate-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00AEEF]/10">
              <svg className="h-6 w-6 text-[#00AEEF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>

            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">Per ward, per month</p>
            <p className="mb-1 text-5xl font-bold tracking-tight text-[#0B1E36]">
              <span className="text-2xl align-top">£</span>79.99
            </p>
            <p className="mb-6 text-sm text-slate-400">Billed monthly. Cancel anytime.</p>

            <ul className="mb-6 space-y-2 text-left text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-[#00AEEF]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Unlimited patients & observations
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-[#00AEEF]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Real-time NEWS2 scoring & alerts
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-[#00AEEF]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                30-day automated PDF reports
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-[#00AEEF]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                UK-hosted, NHS IG compliant
              </li>
            </ul>

            <button
              onClick={() => setShowPricing(false)}
              className="w-full rounded-full bg-[#0B1E36] py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-slate-900/20"
            >
              Subscribe
            </button>
          </div>
        </div>
      )}

      {/* ─── Sign In Modal ─── */}
      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="relative mx-3 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:mx-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-slate-300 transition-colors hover:text-slate-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1E36]">
                <svg className="h-5 w-5 text-[#00AEEF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0B1E36]">Staff Sign In</h2>
                <p className="text-xs text-slate-400">Enter your name and ward code</p>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="mb-1.5 block text-xs font-medium text-slate-500">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1.5 block text-xs font-medium text-slate-500">
                    Surname
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Jones"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wardCode" className="mb-1.5 block text-xs font-medium text-slate-500">
                  Ward Code (4 digits)
                </label>
                <input
                  id="wardCode"
                  type="text"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  inputMode="numeric"
                  value={wardCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setWardCode(v);
                  }}
                  placeholder="e.g. 4821"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                />
              </div>

              <button
                type="submit"
                disabled={wardCode.length !== 4}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1E36] py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-40"
              >
                Sign In
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </button>
            </form>

            <p className="mt-4 text-center text-[10px] text-slate-400">
              Don't have a ward code?{' '}
              <button onClick={() => { setShowLogin(false); setShowSignup(true); }} className="font-medium text-[#00AEEF] hover:underline">
                Register your ward
              </button>
            </p>
            <p className="mt-1 text-center text-[10px] text-slate-400">
              Demo: any name + code <span className="font-medium text-slate-600">1234</span>
            </p>
          </div>
        </div>
      )}

      {/* ─── Sign Up Modal ─── */}
      {showSignup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setShowSignup(false); setGeneratedCode(null); }}
        >
          <div
            className="relative mx-3 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:mx-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setShowSignup(false); setGeneratedCode(null); }}
              className="absolute top-4 right-4 text-slate-300 transition-colors hover:text-slate-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            {generatedCode ? (
              /* ─── Success: Show generated ward code ─── */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                  <svg className="h-7 w-7 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="mb-2 text-lg font-semibold text-[#0B1E36]">Ward Registered!</h2>
                <p className="mb-6 text-sm text-slate-500">
                  Share this code with your staff so they can sign in.
                </p>

                <div className="mb-6 rounded-2xl border-2 border-dashed border-[#00AEEF]/30 bg-[#00AEEF]/5 p-6">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">Your Ward Code</p>
                  <p className="text-5xl font-bold tracking-[0.3em] text-[#0B1E36]">{generatedCode}</p>
                </div>

                <p className="mb-6 text-xs text-slate-400">
                  A confirmation email has been sent to <span className="font-medium text-slate-600">{managerEmail}</span>
                </p>

                <button
                  onClick={() => { setShowSignup(false); setGeneratedCode(null); setShowLogin(true); }}
                  className="w-full rounded-xl bg-[#0B1E36] py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-slate-900/20"
                >
                  Continue to Sign In
                </button>
              </div>
            ) : (
              /* ─── Sign Up Form ─── */
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00AEEF]/10">
                    <svg className="h-5 w-5 text-[#00AEEF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0B1E36]">Register Ward</h2>
                    <p className="text-xs text-slate-400">Set up your ward to get a 4-digit code for staff</p>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label htmlFor="trustName" className="mb-1.5 block text-xs font-medium text-slate-500">Trust Name</label>
                    <input
                      id="trustName"
                      type="text"
                      required
                      value={trustName}
                      onChange={(e) => setTrustName(e.target.value)}
                      placeholder="e.g. Royal London NHS Trust"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="unitName" className="mb-1.5 block text-xs font-medium text-slate-500">Unit Name</label>
                      <input
                        id="unitName"
                        type="text"
                        required
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                        placeholder="e.g. Acute Medicine"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                      />
                    </div>
                    <div>
                      <label htmlFor="wardName" className="mb-1.5 block text-xs font-medium text-slate-500">Ward Name</label>
                      <input
                        id="wardName"
                        type="text"
                        required
                        value={wardName}
                        onChange={(e) => setWardName(e.target.value)}
                        placeholder="e.g. Ward A1"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="managerEmail" className="mb-1.5 block text-xs font-medium text-slate-500">Manager's Email</label>
                    <input
                      id="managerEmail"
                      type="email"
                      required
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      placeholder="e.g. manager@nhs.net"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                    />
                  </div>

                  <div>
                    <label htmlFor="signupPassword" className="mb-1.5 block text-xs font-medium text-slate-500">Password</label>
                    <input
                      id="signupPassword"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1E36] py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-slate-900/20"
                  >
                    Register & Get Ward Code
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                    </svg>
                  </button>
                </form>

                <p className="mt-4 text-center text-[10px] text-slate-400">
                  Already have a ward code?{' '}
                  <button onClick={() => { setShowSignup(false); setShowLogin(true); }} className="font-medium text-[#00AEEF] hover:underline">
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes ecg-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}

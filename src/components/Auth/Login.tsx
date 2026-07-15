import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const {
    isSetup, isWardUnlocked, isLocked,
    hospitalName, wardDisplayName,
    firstName: lockedFirstName, lastName: lockedLastName,
    recentStaff,
    setup, unlockWard, staffLogin,
  } = useAuth();

  // ─── Setup form state ──────────────────────────────────────────
  const [setupHospital, setSetupHospital] = useState('');
  const [setupWard, setSetupWard] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupDone, setSetupDone] = useState(false);

  // PIN unlock state
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Staff login state
  const [staffFirst, setStaffFirst] = useState('');
  const [staffLast, setStaffLast] = useState('');

  const [loading, setLoading] = useState(false);

  // ─── Setup handler ─────────────────────────────────────────────
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (setupPin.length < 6) { setSetupError('PIN must be at least 6 digits'); return; }
    if (setupPin !== confirmPin) { setSetupError('PINs do not match'); return; }

    setLoading(true);
    try {
      await setup(setupHospital, setupWard, setupPin);
      setSetupDone(true);
    } catch {
      setSetupError('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── PIN unlock handler ────────────────────────────────────────
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setLoading(true);
    try {
      const result = await unlockWard(pin);
      if (!result.ok) {
        setPinError(
          result.retryAfterSeconds
            ? `Too many attempts — locked for ${result.retryAfterSeconds}s`
            : 'Incorrect PIN',
        );
        setPin('');
      }
    } catch {
      setPinError('Unlock failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Staff login handler ───────────────────────────────────────
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    staffLogin(staffFirst.trim(), staffLast.trim());
  };

  const selectRecent = (first: string, last: string) => {
    setStaffFirst(first);
    setStaffLast(last);
  };

  // ═══════════════════════════════════════════════════════════════
  // VIEW 1: First run — Set Up Ward
  // ═══════════════════════════════════════════════════════════════
  if (!isSetup) {
    return (
      <Shell subtitle="Set up your ward">
        {setupDone ? (
          <Card>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <svg className="h-7 w-7 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-[#0B1E36]">Ward Ready!</h2>
              <p className="mb-4 text-sm text-slate-500">Your ward is set up. Now enter your name to start.</p>
              <div className="rounded-xl bg-amber-50 p-3 text-left text-xs text-amber-700">
                <p className="font-semibold">Remember your PIN</p>
                <p className="mt-0.5">Your PIN is needed to unlock the ward after inactivity. It cannot be recovered.</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader
              icon={<PersonPlusIcon />}
              title="Set Up Ward"
              subtitle="Enter your hospital, ward name, and create a PIN"
            />
            <form onSubmit={handleSetup} className="space-y-3">
              <Field label="Hospital Name" id="hospital" required value={setupHospital} onChange={setSetupHospital} placeholder="e.g. Royal London Hospital" />
              <Field label="Ward Name" id="ward" required value={setupWard} onChange={setSetupWard} placeholder="e.g. Ward A1" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Create PIN (6+ digits)" id="pin" type="password" inputMode="numeric" required value={setupPin} onChange={(v) => { setSetupPin(v.replace(/\D/g, '')); setSetupError(''); }} placeholder="••••••" />
                <Field label="Confirm PIN" id="confirmPin" type="password" inputMode="numeric" required value={confirmPin} onChange={(v) => { setConfirmPin(v.replace(/\D/g, '')); setSetupError(''); }} placeholder="••••••" />
              </div>
              {setupError && <p className="text-xs font-medium text-red-500">{setupError}</p>}
              <SubmitButton loading={loading} label="Set Up Ward" />
            </form>
          </Card>
        )}
      </Shell>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW 2: Ward locked — Enter PIN
  // ═══════════════════════════════════════════════════════════════
  if (!isWardUnlocked) {
    return (
      <Shell subtitle={isLocked && lockedFirstName ? `${lockedFirstName} ${lockedLastName} — ${wardDisplayName}` : `${hospitalName} — ${wardDisplayName}`}>
        <Card>
          <CardHeader
            icon={<LockIcon />}
            title={isLocked && lockedFirstName ? `Locked — ${lockedFirstName} ${lockedLastName}` : wardDisplayName}
            subtitle="Enter ward PIN to unlock"
          />
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label htmlFor="pin" className="mb-1.5 block text-xs font-medium text-slate-500">Ward PIN</label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                required
                autoFocus
                autoComplete="off"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                placeholder="Enter PIN"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
              />
              {pinError && <p className="mt-1.5 text-xs font-medium text-red-500">{pinError}</p>}
            </div>
            <SubmitButton loading={loading} label="Unlock" disabled={pin.length < 6} />
          </form>
          <p className="mt-4 text-center text-[10px] text-slate-400">{hospitalName}</p>
        </Card>
      </Shell>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW 3: Ward unlocked — Staff name entry
  // ═══════════════════════════════════════════════════════════════
  return (
    <Shell subtitle={`${hospitalName} — ${wardDisplayName}`}>
      <Card>
        <CardHeader
          icon={<UserIcon />}
          title="Staff Sign In"
          subtitle="Enter your name to start recording"
        />
        <form onSubmit={handleStaffLogin} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" id="staffFirst" required value={staffFirst} onChange={setStaffFirst} placeholder="e.g. Sarah" autoFocus />
            <Field label="Surname" id="staffLast" required value={staffLast} onChange={setStaffLast} placeholder="e.g. Jones" />
          </div>
          <SubmitButton loading={false} label="Sign In" disabled={!staffFirst.trim() || !staffLast.trim()} />
        </form>

        {/* Recent staff for quick sign in */}
        {recentStaff.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recentStaff.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectRecent(s.firstName, s.lastName)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-[#00AEEF]/30 hover:bg-white hover:shadow-sm"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00AEEF]/10 text-[9px] font-bold text-[#00AEEF]">
                    {s.firstName.charAt(0)}{s.lastName.charAt(0)}
                  </span>
                  {s.firstName} {s.lastName}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </Shell>
  );
}

// ─── Shared Components ─────────────────────────────────────────────

// text-base (16px) on inputs stops iOS Safari's focus auto-zoom
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]';

function Shell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-8">
      <EcgBackground />
      <div className="relative z-10 mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1E36] shadow-lg">
          <svg className="h-7 w-7 text-[#00AEEF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B1E36] sm:text-3xl">
          NEWS<span className="text-[#00AEEF]">2</span> Digital Chart
        </h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>;
}

function CardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00AEEF]/10">{icon}</div>
      <div>
        <h2 className="text-lg font-semibold text-[#0B1E36]">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, id, type = 'text', inputMode, required, value, onChange, placeholder, autoFocus }: {
  label: string; id: string; type?: string; inputMode?: 'numeric'; required?: boolean;
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-500">{label}</label>
      {/* Shared ward device: never let the browser store or suggest values */}
      <input id={id} type={type} inputMode={inputMode} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} autoComplete="off" className={inputClass} />
    </div>
  );
}

function SubmitButton({ loading, label, disabled }: { loading: boolean; label: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1E36] py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-40"
    >
      {loading ? 'Please wait...' : label}
      {!loading && (
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

function EcgBackground() {
  const p = "M0,100 L80,100 L100,100 L110,90 L120,100 L160,100 L175,100 L180,60 L185,160 L190,30 L195,140 L200,100 L220,100 L240,95 L260,100 L300,100 M300,100 L380,100 L400,100 L410,90 L420,100 L460,100 L475,100 L480,60 L485,160 L490,30 L495,140 L500,100 L520,100 L540,95 L560,100 L600,100 M600,100 L680,100 L700,100 L710,90 L720,100 L760,100 L775,100 L780,60 L785,160 L790,30 L795,140 L800,100 L820,100 L840,95 L860,100 L900,100 M900,100 L980,100 L1000,100 L1010,90 L1020,100 L1060,100 L1075,100 L1080,60 L1085,160 L1090,30 L1095,140 L1100,100 L1120,100 L1140,95 L1160,100 L1200,100 M1200,100 L1280,100 L1300,100 L1310,90 L1320,100 L1360,100 L1375,100 L1380,60 L1385,160 L1390,30 L1395,140 L1400,100 L1420,100 L1440,95 L1460,100 L1500,100 M1500,100 L1580,100 L1600,100 L1610,90 L1620,100 L1660,100 L1675,100 L1680,60 L1685,160 L1690,30 L1695,140 L1700,100 L1720,100 L1740,95 L1760,100 L1800,100 M1800,100 L1880,100 L1900,100 L1910,90 L1920,100 L1960,100 L1975,100 L1980,60 L1985,160 L1990,30 L1995,140 L2000,100 L2020,100 L2040,95 L2060,100 L2100,100 M2100,100 L2180,100 L2200,100 L2210,90 L2220,100 L2260,100 L2275,100 L2280,60 L2285,160 L2290,30 L2295,140 L2300,100 L2320,100 L2340,95 L2360,100 L2400,100";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]" aria-hidden="true">
      {/* Transform is animated on this div (not the SVG) so it composites on
          the GPU instead of repainting the vector every frame */}
      <div className="ecg-anim absolute left-0 h-40 w-[300%]" style={{ top: 'calc(50% - 5rem)' }}>
        <svg viewBox="0 0 2400 200" className="h-full w-full" preserveAspectRatio="none">
          <path d={p} fill="none" stroke="#0B1E36" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function PersonPlusIcon() {
  return <svg className="h-5 w-5 text-[#00AEEF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>;
}
function LockIcon() {
  return <svg className="h-5 w-5 text-[#00AEEF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>;
}
function UserIcon() {
  return <svg className="h-5 w-5 text-[#00AEEF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}

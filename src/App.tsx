import { useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import Login from '@/components/Auth/Login';
import Dashboard from '@/components/Dashboard/Dashboard';
import NewPatient from '@/components/PatientList/NewPatient';
import PatientDetail from '@/components/PatientList/PatientDetail';
import EntryForm from '@/components/EntryForm/EntryForm';
import Settings from '@/components/Settings/Settings';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`text-sm transition ${
        active ? 'font-medium text-white' : 'text-slate-400 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, ward, staffName, initials, staffLogout } = useAuth();
  const { patients, observations, addPatient, addObservation } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00AEEF] border-t-transparent" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Floating pill navbar */}
      <div className="sticky top-2 z-50 mx-auto w-full max-w-5xl px-2 pt-2 sm:top-3 sm:px-3 sm:pt-3">
        <nav className="relative flex h-12 items-center justify-between rounded-full bg-[#0B1E36] px-3 ring-1 ring-white/10 sm:h-14 sm:px-4">
          {/* Logo + nav links */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-1.5" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00AEEF] sm:h-8 sm:w-8">
                <svg className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
                NEWS<span className="text-[#00AEEF]">2</span>
              </span>
            </Link>
            <div className="hidden items-center gap-5 md:flex">
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/settings">Settings</NavLink>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00AEEF]/15 text-xs font-bold text-[#00AEEF]">
                {initials}
              </div>
              <span className="text-xs text-slate-400">
                {staffName} &middot; {ward?.name}
              </span>
            </div>
            <button
              onClick={staffLogout}
              className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Sign Out
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="absolute left-4 right-4 top-full mt-2 rounded-2xl bg-[#0B1E36] p-4 shadow-xl ring-1 ring-white/10 md:hidden">
              <div className="flex flex-col gap-3">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">Dashboard</Link>
                <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">Settings</Link>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2 px-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00AEEF]/15 text-[10px] font-bold text-[#00AEEF]">
                      {initials}
                    </div>
                    <p className="text-xs text-slate-500">{staffName} &middot; {ward?.name}</p>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); staffLogout(); }}
                    className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-red-400 transition hover:bg-white/10"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6 md:py-8">
        <Routes>
          <Route path="/" element={<Dashboard patients={patients} observations={observations} staffName={staffName} onAddObservation={addObservation} />} />
          <Route path="/patients/new" element={<NewPatient onAdd={addPatient} />} />
          <Route path="/patients/:id" element={<PatientDetail patients={patients} observations={observations} />} />
          <Route path="/patients/:id/observe" element={<EntryForm onSave={addObservation} staffName={staffName} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-400 sm:py-4">
        Not a certified medical device. Clinical decisions must follow local trust policies.
      </footer>
    </div>
  );
}

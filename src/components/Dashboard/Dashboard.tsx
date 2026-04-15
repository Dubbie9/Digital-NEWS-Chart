import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Patient, Observation } from '@/types';
import { CLINICAL_RESPONSES } from '@/lib/scoring';
import ObservationModal from '@/components/EntryForm/ObservationModal';
import { exportAllObservations } from '@/lib/exportCsv';
import { useAuth } from '@/hooks/useAuth';
import { seedDemoData } from '@/lib/seedData';

interface Props {
  patients: Patient[];
  observations: Observation[];
  staffName: string;
  onAddObservation: (observation: Observation) => void;
}

export default function Dashboard({ patients, observations, staffName, onAddObservation }: Props) {
  const { cryptoKey } = useAuth();
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);
  const [seeding, setSeeding] = useState(false);

  const today = new Date().toDateString();
  const todayObs = observations.filter(
    (o) => new Date(o.recordedAt).toDateString() === today,
  );

  function latestObsFor(patientId: string): Observation | undefined {
    return [...observations]
      .filter((o) => o.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
  }

  // Sort patients by room/bed number
  const sortedByRoom = [...patients].sort((a, b) => {
    const roomA = a.roomNumber || '';
    const roomB = b.roomNumber || '';
    const numA = parseInt(roomA, 10);
    const numB = parseInt(roomB, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return roomA.localeCompare(roomB);
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#0B1E36] sm:text-2xl">Ward Dashboard</h1>
          <p className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-sm">Overview of patients and observations</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => exportAllObservations(patients, observations)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Export All
          </button>
          <Link
            to="/patients/new"
            className="group inline-flex items-center gap-1.5 rounded-full bg-[#0B1E36] px-3 py-2 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            + New Patient
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Patients" value={String(patients.length)} icon="clipboard" />
        <StatCard label="Observations Today" value={String(todayObs.length)} icon="activity" />
        <StatCard label="Total Observations" value={String(observations.length)} icon="chart" />
      </section>

      {/* Today's Observations — patients sorted by room number */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-base font-semibold text-[#0B1E36]">
            Today's Observations
            <span className="ml-2 text-xs font-normal text-slate-400">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </h2>
        </div>

        {patients.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-6 sm:py-12">
            <p className="mb-4 text-sm text-slate-400">No patients yet. Add a patient or load demo data.</p>
            <button
              onClick={async () => {
                if (!cryptoKey || seeding) return;
                setSeeding(true);
                try {
                  await seedDemoData(cryptoKey);
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:opacity-40"
            >
              {seeding ? 'Loading demo data...' : 'Load Demo Data (15 patients, 36 days)'}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 md:px-6">Name</th>
                    <th className="px-4 py-3 md:px-6">Room / Bed</th>
                    <th className="px-4 py-3 text-center md:px-6">Score</th>
                    <th className="px-4 py-3 text-right md:px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedByRoom.map((patient) => {
                    const latest = latestObsFor(patient.id);
                    const response = latest ? CLINICAL_RESPONSES[latest.riskLevel] : null;
                    const hasTodayObs = todayObs.some((o) => o.patientId === patient.id);

                    return (
                      <tr key={patient.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3 md:px-6">
                          <Link
                            to={`/patients/${patient.id}`}
                            className="font-medium text-[#0B1E36] underline decoration-slate-300 underline-offset-2 transition hover:text-[#00AEEF] hover:decoration-[#00AEEF]"
                          >
                            {patient.lastName}, {patient.firstName}
                          </Link>
                          {hasTodayObs && (
                            <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-green-400" title="Observed today" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 md:px-6">
                          {patient.roomNumber || '—'}
                        </td>
                        <td className="px-4 py-3 text-center md:px-6">
                          {response && latest ? (
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${response.colour}`}>
                              {latest.totalScore}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right md:px-6">
                          <button
                            onClick={() => setModalPatient(patient)}
                            className="rounded-full bg-[#00AEEF] px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#00AEEF]/20 md:px-4"
                          >
                            Record Obs
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {sortedByRoom.map((patient) => {
                const latest = latestObsFor(patient.id);
                const response = latest ? CLINICAL_RESPONSES[latest.riskLevel] : null;
                const hasTodayObs = todayObs.some((o) => o.patientId === patient.id);

                return (
                  <div key={patient.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="block truncate text-sm font-medium text-[#0B1E36] underline decoration-slate-300 underline-offset-2 transition hover:text-[#00AEEF] hover:decoration-[#00AEEF]"
                      >
                        {patient.lastName}, {patient.firstName}
                        {hasTodayObs && (
                          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                        )}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {patient.roomNumber || 'No bed'}
                        {response && latest && (
                          <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${response.colour}`}>
                            {latest.totalScore}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setModalPatient(patient)}
                      className="shrink-0 rounded-full bg-[#00AEEF] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Record
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Observation modal */}
      {modalPatient && (
        <ObservationModal
          patientId={modalPatient.id}
          patientName={`${modalPatient.lastName}, ${modalPatient.firstName}`}
          staffName={staffName}
          onSave={onAddObservation}
          onClose={() => setModalPatient(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    clipboard: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
      </svg>
    ),
    activity: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    chart: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#00AEEF]/10 text-[#00AEEF] transition-colors group-hover:bg-[#00AEEF] group-hover:text-white sm:mb-3 sm:h-10 sm:w-10">
        {icons[icon]}
      </div>
      <p className="text-[10px] font-medium text-slate-400 sm:text-xs">{label}</p>
      <p className="text-xl font-semibold tracking-tight text-[#0B1E36] sm:text-2xl">{value}</p>
    </div>
  );
}

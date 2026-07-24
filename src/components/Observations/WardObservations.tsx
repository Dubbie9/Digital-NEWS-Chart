import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Patient, Observation } from '@/types';
import { CLINICAL_RESPONSES } from '@/lib/scoring';
import ObservationModal from '@/components/EntryForm/ObservationModal';

interface Props {
  patients: Patient[];
  observations: Observation[];
  staffName: string;
  onAddObservation: (observation: Observation) => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Per-patient roll-up for the selected day. */
interface DayEntry {
  latest: Observation;
  count: number;
}

export default function WardObservations({ patients, observations, staffName, onAddObservation }: Props) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);

  const dayKey = selectedDate.toDateString();
  const isToday = dayKey === now.toDateString();

  // Latest observation per patient for the selected day, plus how many
  // were recorded that day — computed in a single pass over all obs.
  const dayData = useMemo(() => {
    const map = new Map<string, DayEntry>();
    for (const o of observations) {
      if (new Date(o.recordedAt).toDateString() !== dayKey) continue;
      const cur = map.get(o.patientId);
      if (!cur) {
        map.set(o.patientId, { latest: o, count: 1 });
      } else {
        cur.count += 1;
        if (o.recordedAt > cur.latest.recordedAt) cur.latest = o;
      }
    }
    return map;
  }, [observations, dayKey]);

  // Sort patients by room/bed number (numeric where possible)
  const sortedByRoom = useMemo(() => {
    return [...patients].sort((a, b) => {
      const roomA = a.roomNumber || '';
      const roomB = b.roomNumber || '';
      const numA = parseInt(roomA, 10);
      const numB = parseInt(roomB, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return roomA.localeCompare(roomB);
    });
  }, [patients]);

  const observedCount = dayData.size;
  const pendingCount = patients.length - observedCount;
  const escalationCount = useMemo(() => {
    let n = 0;
    for (const { latest } of dayData.values()) {
      if (!latest.declined && latest.totalScore >= 5) n += 1;
    }
    return n;
  }, [dayData]);

  const shiftDay = (delta: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const dateLabel = selectedDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#0B1E36] sm:text-2xl">
            {isToday ? "Today's Observations" : 'Ward Observations'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-sm">
            Every patient's observations for the selected day
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 self-start text-sm text-[#00AEEF] transition hover:underline sm:self-auto"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to dashboard
        </Link>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:px-4">
        <button
          onClick={() => shiftDay(-1)}
          aria-label="Previous day"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#0B1E36]">{dateLabel}</h2>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="rounded-full bg-[#00AEEF]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#00AEEF] transition hover:bg-[#00AEEF]/20"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => shiftDay(1)}
          disabled={isToday}
          aria-label="Next day"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Summary chips */}
      {patients.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {observedCount} of {patients.length} observed
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {pendingCount} pending
            </span>
          )}
          {escalationCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 font-medium text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {escalationCount} need review
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {patients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm sm:px-6 sm:py-12">
          <p className="mb-4 text-sm text-slate-400">No patients on the ward yet.</p>
          <Link
            to="/patients/new"
            className="rounded-full bg-[#0B1E36] px-5 py-2 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            + New Patient
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="sticky left-0 z-20 bg-slate-50 px-3 py-3 md:px-4">Patient</th>
                  <th className="px-3 py-3 text-center md:px-4">Resp</th>
                  <th className="px-3 py-3 text-center md:px-4">SpO2</th>
                  <th className="hidden px-3 py-3 text-center lg:table-cell md:px-4">Scale</th>
                  <th className="hidden px-3 py-3 text-center lg:table-cell md:px-4">Air/O2</th>
                  <th className="px-3 py-3 text-center md:px-4">BP</th>
                  <th className="px-3 py-3 text-center md:px-4">Pulse</th>
                  <th className="px-3 py-3 text-center md:px-4">Temp</th>
                  <th className="px-3 py-3 text-center md:px-4">ACVPU</th>
                  <th className="px-3 py-3 text-center md:px-4">NEWS2</th>
                  <th className="px-3 py-3 text-center md:px-4">Time</th>
                  <th className="hidden px-3 py-3 text-center lg:table-cell md:px-4">By</th>
                  <th className="px-3 py-3 text-right md:px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedByRoom.map((patient) => {
                  const entry = dayData.get(patient.id);
                  const obs = entry?.latest;
                  const response = obs && !obs.declined ? CLINICAL_RESPONSES[obs.riskLevel] : null;
                  const dt = obs ? new Date(obs.recordedAt) : null;
                  const dash = <span className="text-slate-300">—</span>;

                  return (
                    <tr key={patient.id} className="group transition hover:bg-slate-50">
                      {/* Patient (sticky identity column) */}
                      <td className="sticky left-0 z-10 bg-white px-3 py-3 transition group-hover:bg-slate-50 md:px-4">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="block whitespace-nowrap font-medium text-[#0B1E36] underline decoration-slate-300 underline-offset-2 transition hover:text-[#00AEEF]"
                        >
                          {patient.lastName}, {patient.firstName}
                        </Link>
                        <span className="text-xs text-slate-400">
                          {patient.roomNumber ? `Bed ${patient.roomNumber}` : 'No bed'}
                        </span>
                      </td>

                      {obs && !obs.declined ? (
                        <>
                          <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.respirationRate}</td>
                          <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.spO2}%</td>
                          <td className="hidden px-3 py-3 text-center text-slate-600 lg:table-cell md:px-4">{obs.spO2Scale}</td>
                          <td className="hidden px-3 py-3 text-center text-slate-600 lg:table-cell md:px-4">
                            {obs.oxygenDelivery === 'Oxygen' ? 'O₂' : 'Air'}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-600 md:px-4">
                            {obs.systolicBP}/{obs.diastolicBP ?? '—'}
                          </td>
                          <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.pulse}</td>
                          <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.temperature}°C</td>
                          <td className="px-3 py-3 text-center text-slate-600 md:px-4">
                            {obs.consciousness.substring(0, 1)}
                          </td>
                          <td className="px-3 py-3 text-center md:px-4">
                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${response!.colour}`}>
                              {obs.totalScore}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-slate-400">{response!.label}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-center text-xs text-slate-500 md:px-4">
                            {dt!.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            {entry!.count > 1 && (
                              <span className="mt-0.5 block text-[10px] text-slate-400">+{entry!.count - 1} earlier</span>
                            )}
                          </td>
                          <td className="hidden px-3 py-3 text-center text-xs text-slate-500 lg:table-cell md:px-4">
                            {getInitials(obs.recordedBy)}
                          </td>
                        </>
                      ) : obs && obs.declined ? (
                        <>
                          <td colSpan={8} className="px-3 py-3 text-center md:px-4">
                            <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                              Declined
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-center text-xs text-slate-500 md:px-4">
                            {dt!.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="hidden px-3 py-3 text-center text-xs text-slate-500 lg:table-cell md:px-4">
                            {getInitials(obs.recordedBy)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-3 text-center md:px-4">{dash}</td>
                          <td className="px-3 py-3 text-center md:px-4">{dash}</td>
                          <td className="hidden px-3 py-3 text-center lg:table-cell md:px-4">{dash}</td>
                          <td className="hidden px-3 py-3 text-center lg:table-cell md:px-4">{dash}</td>
                          <td className="px-3 py-3 text-center md:px-4">{dash}</td>
                          <td className="px-3 py-3 text-center md:px-4">{dash}</td>
                          <td className="px-3 py-3 text-center md:px-4">{dash}</td>
                          <td className="px-3 py-3 text-center md:px-4">{dash}</td>
                          <td className="px-3 py-3 text-center md:px-4">
                            <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                              Pending
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center md:px-4">{dash}</td>
                          <td className="hidden px-3 py-3 text-center lg:table-cell md:px-4">{dash}</td>
                        </>
                      )}

                      {/* Record action */}
                      <td className="px-3 py-3 text-right md:px-4">
                        <button
                          onClick={() => setModalPatient(patient)}
                          className="whitespace-nowrap rounded-full bg-[#00AEEF] px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#00AEEF]/20 md:px-4"
                        >
                          Record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 sm:hidden">
            {sortedByRoom.map((patient) => {
              const entry = dayData.get(patient.id);
              const obs = entry?.latest;
              const response = obs && !obs.declined ? CLINICAL_RESPONSES[obs.riskLevel] : null;
              const dt = obs ? new Date(obs.recordedAt) : null;

              return (
                <div key={patient.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="block truncate text-sm font-medium text-[#0B1E36] underline decoration-slate-300 underline-offset-2"
                      >
                        {patient.lastName}, {patient.firstName}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {patient.roomNumber ? `Bed ${patient.roomNumber}` : 'No bed'}
                        {dt && (
                          <span className="ml-2">
                            {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            {entry!.count > 1 && ` · +${entry!.count - 1}`}
                          </span>
                        )}
                      </p>
                    </div>
                    {obs && obs.declined ? (
                      <span className="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-500">Declined</span>
                    ) : response && obs ? (
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${response.colour}`}>
                        {obs.totalScore} · {response.label}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">Pending</span>
                    )}
                  </div>

                  {obs && !obs.declined && (
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div><p className="text-slate-400">Resp</p><p className="font-medium text-slate-700">{obs.respirationRate}</p></div>
                      <div><p className="text-slate-400">SpO2</p><p className="font-medium text-slate-700">{obs.spO2}%</p></div>
                      <div><p className="text-slate-400">BP</p><p className="font-medium text-slate-700">{obs.systolicBP}/{obs.diastolicBP ?? '—'}</p></div>
                      <div><p className="text-slate-400">Pulse</p><p className="font-medium text-slate-700">{obs.pulse}</p></div>
                      <div><p className="text-slate-400">Temp</p><p className="font-medium text-slate-700">{obs.temperature}°C</p></div>
                      <div><p className="text-slate-400">ACVPU</p><p className="font-medium text-slate-700">{obs.consciousness.substring(0, 1)}</p></div>
                      <div><p className="text-slate-400">Air/O2</p><p className="font-medium text-slate-700">{obs.oxygenDelivery === 'Oxygen' ? 'O₂' : 'Air'}</p></div>
                      <div><p className="text-slate-400">By</p><p className="font-medium text-slate-700">{getInitials(obs.recordedBy)}</p></div>
                    </div>
                  )}

                  <button
                    onClick={() => setModalPatient(patient)}
                    className="mt-3 w-full rounded-full bg-[#00AEEF] px-3 py-2 text-xs font-medium text-white transition hover:shadow-md"
                  >
                    Record Obs
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

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

import { useState } from 'react';
import type { Observation } from '@/types';
import { CLINICAL_RESPONSES } from '@/lib/scoring';

interface Props {
  observations: Observation[];
}

function getAvailableMonths(observations: Observation[]): { year: number; month: number }[] {
  const set = new Set<string>();
  for (const o of observations) {
    const d = new Date(o.recordedAt);
    set.add(`${d.getFullYear()}-${d.getMonth()}`);
  }
  return Array.from(set)
    .map((k) => { const [y, m] = k.split('-').map(Number); return { year: y, month: m }; })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export default function ObservationHistory({ observations }: Props) {
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth());

  const availableMonths = getAvailableMonths(observations);

  // Filter observations to selected month
  const filtered = observations.filter((o) => {
    const d = new Date(o.recordedAt);
    return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );

  if (observations.length === 0) {
    return <p className="text-sm text-slate-400">No observations recorded for this patient.</p>;
  }

  const sundayRowClass = 'bg-amber-50/60 font-semibold';

  return (
    <div className="space-y-4">
      {/* Month filter */}
      <div className="flex flex-wrap gap-1.5">
        {availableMonths.map(({ year: y, month: m }) => (
          <button
            key={`${y}-${m}`}
            onClick={() => { setFilterYear(y); setFilterMonth(m); }}
            className={`rounded-full px-3 py-1 text-[10px] font-medium transition ${
              filterYear === y && filterMonth === m
                ? 'bg-[#0B1E36] text-white'
                : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            {new Date(y, m).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No observations in {new Date(filterYear, filterMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.</p>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-3 sm:hidden">
            {sorted.map((obs) => {
              const response = CLINICAL_RESPONSES[obs.riskLevel];
              const dt = new Date(obs.recordedAt);
              const sunday = isSunday(dt);

              return (
                <div key={obs.id} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${sunday ? 'ring-2 ring-amber-200' : ''}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className={`text-sm text-[#0B1E36] ${sunday ? 'font-bold' : 'font-medium'}`}>
                        {dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                        <span className="ml-2 text-xs text-slate-400">
                          {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {sunday && <span className="ml-1.5 text-[10px] text-amber-500">SUN</span>}
                      </p>
                      <p className="text-xs text-slate-400">By: {obs.recordedBy}</p>
                    </div>
                    {obs.declined ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-500">Declined</span>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${response.colour}`}>
                        {obs.totalScore} - {response.label}
                      </span>
                    )}
                  </div>
                  {!obs.declined && (
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div><p className="text-slate-400">Resp</p><p className="font-medium text-slate-700">{obs.respirationRate}</p></div>
                      <div><p className="text-slate-400">SpO2</p><p className="font-medium text-slate-700">{obs.spO2}%</p></div>
                      <div><p className="text-slate-400">BP</p><p className="font-medium text-slate-700">{obs.systolicBP}/{obs.diastolicBP ?? '—'}</p></div>
                      <div><p className="text-slate-400">Pulse</p><p className="font-medium text-slate-700">{obs.pulse}</p></div>
                      <div><p className="text-slate-400">Temp</p><p className="font-medium text-slate-700">{obs.temperature}°C</p></div>
                      <div><p className="text-slate-400">ACVPU</p><p className="font-medium text-slate-700">{obs.consciousness.substring(0, 1)}</p></div>
                      <div><p className="text-slate-400">Air/O2</p><p className="font-medium text-slate-700">{obs.oxygenDelivery === 'Oxygen' ? 'O\u2082' : 'Air'}</p></div>
                      <div><p className="text-slate-400">Weight</p><p className="font-medium text-slate-700">{obs.weight ? `${obs.weight}kg` : '—'}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-3 md:px-4">Date & Time</th>
                  <th className="px-3 py-3 md:px-4">By</th>
                  <th className="px-3 py-3 text-center md:px-4">Resp</th>
                  <th className="px-3 py-3 text-center md:px-4">SpO2</th>
                  <th className="hidden px-3 py-3 text-center lg:table-cell md:px-4">Scale</th>
                  <th className="hidden px-3 py-3 text-center lg:table-cell md:px-4">Air/O2</th>
                  <th className="px-3 py-3 text-center md:px-4">BP</th>
                  <th className="px-3 py-3 text-center md:px-4">Pulse</th>
                  <th className="px-3 py-3 text-center md:px-4">ACVPU</th>
                  <th className="px-3 py-3 text-center md:px-4">Temp</th>
                  <th className="px-3 py-3 text-center md:px-4">Weight</th>
                  <th className="px-3 py-3 text-center md:px-4">Total</th>
                  <th className="px-3 py-3 text-center md:px-4">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((obs) => {
                  const response = CLINICAL_RESPONSES[obs.riskLevel];
                  const dt = new Date(obs.recordedAt);
                  const sunday = isSunday(dt);

                  if (obs.declined) {
                    return (
                      <tr key={obs.id} className={`bg-slate-50/50 ${sunday ? sundayRowClass : ''}`}>
                        <td className="px-3 py-3 whitespace-nowrap md:px-4">
                          <div className={`text-[#0B1E36] ${sunday ? 'font-bold' : 'font-medium'}`}>
                            {dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                            {sunday && <span className="ml-1 text-[10px] text-amber-500">SUN</span>}
                          </div>
                          <div className="text-xs text-slate-400">
                            {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-500 md:px-4">{obs.recordedBy}</td>
                        <td colSpan={9} className="px-3 py-3 text-center md:px-4">
                          <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                            Declined
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center md:px-4">
                          <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-500">—</span>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={obs.id} className={`transition hover:bg-slate-50 ${sunday ? sundayRowClass : ''}`}>
                      <td className="px-3 py-3 whitespace-nowrap md:px-4">
                        <div className={`text-[#0B1E36] ${sunday ? 'font-bold' : 'font-medium'}`}>
                          {dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                          {sunday && <span className="ml-1 text-[10px] text-amber-500">SUN</span>}
                        </div>
                        <div className="text-xs text-slate-400">
                          {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500 md:px-4">{obs.recordedBy}</td>
                      <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.respirationRate}</td>
                      <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.spO2}%</td>
                      <td className="hidden px-3 py-3 text-center text-slate-600 lg:table-cell md:px-4">{obs.spO2Scale}</td>
                      <td className="hidden px-3 py-3 text-center text-slate-600 lg:table-cell md:px-4">
                        {obs.oxygenDelivery === 'Oxygen' ? 'O\u2082' : 'Air'}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.systolicBP}/{obs.diastolicBP ?? '—'}</td>
                      <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.pulse}</td>
                      <td className="px-3 py-3 text-center text-slate-600 md:px-4">
                        {obs.consciousness.substring(0, 1)}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.temperature}°C</td>
                      <td className="px-3 py-3 text-center text-slate-600 md:px-4">{obs.weight ? `${obs.weight}kg` : '—'}</td>
                      <td className="px-3 py-3 text-center font-bold text-[#0B1E36] md:px-4">{obs.totalScore}</td>
                      <td className="px-3 py-3 text-center md:px-4">
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold md:px-3 ${response.colour}`}>
                          {response.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

import type { Observation } from '@/types';

interface Props {
  observations: Observation[];
  patientName: string;
}

const PARAM_ROWS: { key: keyof Observation; label: string; unit: string }[] = [
  { key: 'respirationRate', label: 'Respiration Rate', unit: 'breaths/min' },
  { key: 'spO2', label: 'SpO2', unit: '%' },
  { key: 'oxygenDelivery', label: 'Air / Oxygen', unit: '' },
  { key: 'systolicBP', label: 'Systolic BP', unit: 'mmHg' },
  { key: 'pulse', label: 'Pulse', unit: 'bpm' },
  { key: 'consciousness', label: 'Consciousness', unit: '' },
  { key: 'temperature', label: 'Temperature', unit: '°C' },
];

function scoreColour(score: number): string {
  if (score === 0) return 'bg-white';
  if (score === 1) return 'bg-yellow-100';
  if (score === 2) return 'bg-orange-200';
  return 'bg-red-300';
}

export default function Chart({ observations, patientName }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">NEWS2 Chart — {patientName}</h2>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left text-gray-700">Parameter</th>
              {observations.map((obs) => (
                <th key={obs.id} className="border px-3 py-2 text-center text-gray-700">
                  <div className="text-xs">
                    {new Date(obs.recordedAt).toLocaleDateString('en-GB')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(obs.recordedAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARAM_ROWS.map((row) => (
              <tr key={row.key}>
                <td className="border px-3 py-2 font-medium text-gray-700">
                  {row.label}
                  {row.unit && (
                    <span className="ml-1 text-xs text-gray-400">({row.unit})</span>
                  )}
                </td>
                {observations.map((obs) => {
                  const paramScore =
                    obs.scores[row.key as keyof typeof obs.scores] as number | undefined;
                  return (
                    <td
                      key={obs.id}
                      className={`border px-3 py-2 text-center ${paramScore !== undefined ? scoreColour(paramScore) : ''}`}
                    >
                      {String(obs[row.key])}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Total score row */}
            <tr className="font-bold">
              <td className="border px-3 py-2 text-gray-900">NEWS2 Total</td>
              {observations.map((obs) => (
                <td
                  key={obs.id}
                  className={`border px-3 py-2 text-center ${
                    obs.totalScore >= 7
                      ? 'bg-red-300'
                      : obs.totalScore >= 5
                        ? 'bg-orange-200'
                        : obs.totalScore >= 1
                          ? 'bg-yellow-100'
                          : 'bg-white'
                  }`}
                >
                  {obs.totalScore}
                </td>
              ))}
            </tr>

            {/* Staff name row */}
            <tr>
              <td className="border px-3 py-2 text-gray-700">Recorded By</td>
              {observations.map((obs) => (
                <td key={obs.id} className="border px-3 py-2 text-center text-xs text-gray-600">
                  {obs.recordedBy}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {observations.length === 0 && (
        <p className="text-sm text-gray-500">No observations recorded for this patient.</p>
      )}
    </div>
  );
}

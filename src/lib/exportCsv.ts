import type { Observation, Patient } from '@/types';

function obsToRow(obs: Observation, patientName?: string): string[] {
  if (obs.declined) {
    const row = [
      new Date(obs.recordedAt).toLocaleDateString('en-GB'),
      new Date(obs.recordedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      obs.recordedBy,
      'DECLINED', '', '', '', '', '', '', '', '', '',
    ];
    if (patientName !== undefined) row.unshift(patientName);
    return row;
  }

  const row = [
    new Date(obs.recordedAt).toLocaleDateString('en-GB'),
    new Date(obs.recordedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    obs.recordedBy,
    String(obs.respirationRate),
    `${obs.spO2}%`,
    String(obs.spO2Scale),
    obs.oxygenDelivery,
    String(obs.systolicBP),
    obs.diastolicBP !== undefined ? String(obs.diastolicBP) : '',
    String(obs.pulse),
    obs.consciousness,
    `${obs.temperature}`,
    String(obs.totalScore),
    obs.riskLevel,
  ];
  if (patientName !== undefined) row.unshift(patientName);
  return row;
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPatientObservations(
  patient: Patient,
  observations: Observation[],
) {
  const header = ['Date', 'Time', 'Recorded By', 'Resp Rate', 'SpO2', 'Scale', 'Air/O2', 'Systolic BP', 'Diastolic BP', 'Pulse', 'Consciousness', 'Temperature', 'Total Score', 'Risk Level'];
  const sorted = [...observations].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );

  const rows = sorted.map((obs) => obsToRow(obs));
  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

  const name = `${patient.lastName}_${patient.firstName}`.replace(/[^a-zA-Z0-9]/g, '_');
  downloadCsv(`NEWS2_${name}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export function exportAllObservations(
  patients: Patient[],
  observations: Observation[],
) {
  const header = ['Patient', 'Date', 'Time', 'Recorded By', 'Resp Rate', 'SpO2', 'Scale', 'Air/O2', 'Systolic BP', 'Diastolic BP', 'Pulse', 'Consciousness', 'Temperature', 'Total Score', 'Risk Level'];

  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const sorted = [...observations].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );

  const rows = sorted.map((obs) => {
    const patient = patientMap.get(obs.patientId);
    const name = patient ? `${patient.lastName}, ${patient.firstName}` : obs.patientId;
    return obsToRow(obs, name);
  });

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  downloadCsv(`NEWS2_All_Patients_${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

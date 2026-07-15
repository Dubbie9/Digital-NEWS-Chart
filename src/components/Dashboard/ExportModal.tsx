import { useState } from 'react';
import type { Patient, Observation } from '@/types';
import type { PdfExportFormat } from '@/lib/pdf';
import { writeAuditLog } from '@/lib/audit';
import { useAuth } from '@/hooks/useAuth';
import ModalShell from '@/components/common/ModalShell';

interface Props {
  patients: Patient[];
  observations: Observation[];
  wardName: string;
  onClose: () => void;
}

const FORMAT_OPTIONS: { value: PdfExportFormat; label: string; description: string }[] = [
  { value: 'chart', label: 'Filled NEWS2 chart', description: 'The chart as plotted — one page set per month' },
  { value: 'record', label: 'Observation record', description: 'Table of the recorded values' },
  { value: 'both', label: 'Chart + record', description: 'Both in one document' },
];

export default function ExportModal({ patients, observations, wardName, onClose }: Props) {
  const { cryptoKey, staffName } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<PdfExportFormat>('chart');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');

  const allSelected = selected.size === patients.length && patients.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(patients.map((p) => p.id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    const selectedPatients = patients.filter((p) => selected.has(p.id));
    if (selectedPatients.length === 0 || exporting) return;

    setExporting(true);
    setError('');
    setProgress({ done: 0, total: selectedPatients.length });
    try {
      const entries = selectedPatients.map((patient) => ({
        patient,
        observations: observations.filter((o) => o.patientId === patient.id),
      }));
      // Lazy-load the PDF machinery (jsPDF) — keeps it out of the main bundle
      const { exportPatientsPDF } = await import('@/lib/pdf');
      await exportPatientsPDF(entries, wardName, format, (done, total) =>
        setProgress({ done, total }),
      );
      if (cryptoKey) {
        await writeAuditLog(
          cryptoKey,
          'export_data',
          staffName,
          `PDF (${format}): ${selectedPatients.length} patient(s)`,
        );
      }
      onClose();
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Sort by last name
  const sorted = [...patients].sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <ModalShell onClose={onClose} labelledBy="export-modal-title" maxWidth="max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <svg className="h-4.5 w-4.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
            </div>
            <div>
              <h2 id="export-modal-title" className="text-base font-semibold text-[#0B1E36]">Export as PDF</h2>
              <p className="text-xs text-slate-400">Choose format and patients</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Format selection */}
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6" role="radiogroup" aria-label="Export format">
          <div className="grid gap-1.5">
            {FORMAT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 transition ${
                  format === opt.value
                    ? 'border-[#00AEEF] bg-[#00AEEF]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={opt.value}
                  checked={format === opt.value}
                  onChange={() => setFormat(opt.value)}
                  className="mt-0.5 h-4 w-4 border-slate-300 text-[#00AEEF] focus:ring-[#00AEEF]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[#0B1E36]">{opt.label}</span>
                  <span className="block text-xs text-slate-400">{opt.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Select All */}
        <div className="border-b border-slate-100 px-4 py-2.5 sm:px-6">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300 text-[#00AEEF] focus:ring-[#00AEEF]"
            />
            <span className="text-sm font-medium text-[#0B1E36]">
              Select All ({patients.length})
            </span>
          </label>
        </div>

        {/* Patient list */}
        <div className="max-h-[35vh] overflow-y-auto overscroll-y-contain px-4 py-2 sm:px-6">
          {sorted.map((patient) => (
            <label
              key={patient.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-2.5 transition hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.has(patient.id)}
                onChange={() => toggle(patient.id)}
                className="h-4 w-4 rounded border-slate-300 text-[#00AEEF] focus:ring-[#00AEEF]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0B1E36]">
                  {patient.lastName}, {patient.firstName}
                </p>
                <p className="text-xs text-slate-400">
                  {patient.roomNumber ? `Room ${patient.roomNumber}` : 'No room'}
                  {patient.nhsNumber && ` · NHS: ${patient.nhsNumber}`}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          {exporting ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#00AEEF] border-t-transparent" />
              Exporting {progress.done}/{progress.total}...
            </div>
          ) : error ? (
            <p className="text-xs font-medium text-red-500">{error}</p>
          ) : (
            <p className="text-xs text-slate-400">
              {selected.size === 0
                ? 'No patients selected'
                : selected.size === 1
                  ? '1 patient selected'
                  : `${selected.size} patients selected`}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={exporting}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 transition hover:border-slate-300 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={selected.size === 0 || exporting}
              className="rounded-full bg-[#0B1E36] px-4 py-2 text-xs font-medium text-white transition hover:shadow-lg disabled:opacity-40"
            >
              Export PDF
            </button>
          </div>
        </div>
    </ModalShell>
  );
}

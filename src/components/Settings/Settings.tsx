import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { exportBackup, downloadBackup, importBackup, type ImportResult } from '@/lib/backup';
import {
  exportTransferFile,
  downloadTransferFile,
  importTransferFile,
  MIN_TRANSFER_PASSPHRASE_LENGTH,
} from '@/lib/transfer';
import { exportPatientObservations } from '@/lib/exportCsv';
import { writeAuditLog } from '@/lib/audit';

export default function Settings() {
  const { cryptoKey, staffName, ward, hospitalName, resetApp } = useAuth();
  const { patients, observations } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Ward-to-ward transfer state
  const transferFileRef = useRef<HTMLInputElement>(null);
  const [transferSelected, setTransferSelected] = useState<Set<string>>(new Set());
  const [sendPass, setSendPass] = useState('');
  const [receivePass, setReceivePass] = useState('');
  const [transferBusy, setTransferBusy] = useState<'send' | 'receive' | null>(null);
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportAll = async () => {
    if (!cryptoKey) return;
    setExporting(true);
    setMessage(null);
    try {
      const blob = await exportBackup(cryptoKey);
      downloadBackup(blob);
      await writeAuditLog(cryptoKey, 'export_data', staffName, 'Full backup exported');
      setMessage({ type: 'success', text: 'Full backup exported successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Export failed. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPatient = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;
    const patientObs = observations.filter((o) => o.patientId === patientId);
    exportPatientObservations(patient, patientObs);
    if (cryptoKey) {
      writeAuditLog(cryptoKey, 'export_data', staffName, `Patient CSV: ${patient.lastName}, ${patient.firstName}`);
    }
  };

  const handleImport = async (file: File) => {
    if (!cryptoKey) return;
    setImporting(true);
    setMessage(null);
    try {
      const result: ImportResult = await importBackup(cryptoKey, file);
      await writeAuditLog(cryptoKey, 'import_data', staffName, `Merged ${result.patients} new patients, ${result.observations} new observations`);
      setMessage({
        type: 'success',
        text: `Merged ${result.patients} new patients and ${result.observations} new observations (duplicates skipped).`,
      });
    } catch {
      setMessage({ type: 'error', text: 'Import failed. The file may be corrupted or encrypted with a different PIN.' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    await resetApp();
  };

  // ─── Ward-to-ward transfer ───────────────────────────────────────

  const toggleTransferPatient = (id: string) => {
    setTransferSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTransferExport = async () => {
    if (!cryptoKey || transferSelected.size === 0 || sendPass.length < MIN_TRANSFER_PASSPHRASE_LENGTH) return;
    setTransferBusy('send');
    setTransferMsg(null);
    try {
      const selectedPatients = patients.filter((p) => transferSelected.has(p.id));
      const selectedObs = observations.filter((o) => transferSelected.has(o.patientId));
      const blob = await exportTransferFile(sendPass, selectedPatients, selectedObs, {
        hospital: hospitalName || ward?.trustName || '',
        ward: ward?.name || '',
      });
      downloadTransferFile(blob);
      await writeAuditLog(cryptoKey, 'export_data', staffName, `Ward transfer file: ${selectedPatients.length} patient(s)`);
      setTransferMsg({
        type: 'success',
        text: `Transfer file created for ${selectedPatients.length} patient(s). Share the passphrase with the receiving ward separately — never alongside the file.`,
      });
      setSendPass('');
      setTransferSelected(new Set());
    } catch {
      setTransferMsg({ type: 'error', text: 'Could not create the transfer file. Please try again.' });
    } finally {
      setTransferBusy(null);
    }
  };

  const handleTransferImport = async (file: File) => {
    if (!cryptoKey || receivePass.length < MIN_TRANSFER_PASSPHRASE_LENGTH) return;
    setTransferBusy('receive');
    setTransferMsg(null);
    try {
      const result = await importTransferFile(receivePass, file, cryptoKey, ward?.id);
      await writeAuditLog(
        cryptoKey,
        'import_data',
        staffName,
        `Ward transfer received${result.sourceWard ? ` from "${result.sourceWard}"` : ''}: ${result.patients} patients, ${result.observations} observations`,
      );
      setTransferMsg({
        type: 'success',
        text: `Received ${result.patients} new patient(s) and ${result.observations} observation(s)${result.sourceWard ? ` from ${result.sourceWard}` : ''}. Records already on this device were skipped.`,
      });
      setReceivePass('');
    } catch {
      setTransferMsg({ type: 'error', text: 'Import failed — wrong passphrase or not a valid transfer file.' });
    } finally {
      setTransferBusy(null);
      if (transferFileRef.current) transferFileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#0B1E36] sm:text-2xl">Settings</h1>
        <p className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-sm">Manage your ward data and security</p>
      </div>

      {/* Ward info */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-sm font-semibold text-[#0B1E36]">Ward Information</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Hospital</p>
            <p className="font-medium text-slate-700">{hospitalName || ward?.trustName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Ward</p>
            <p className="font-medium text-slate-700">{ward?.name || '—'}</p>
          </div>
        </div>
      </section>

      {/* Backup & Restore */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-sm font-semibold text-[#0B1E36]">Backup & Restore</h2>
        <p className="mb-4 text-xs text-slate-400">Export an encrypted backup or restore from a previous backup file. Imports merge data without duplicating.</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleExportAll}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1E36] px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            {exporting ? 'Exporting...' : 'Export Full Backup'}
          </button>

          <label
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${importing ? 'opacity-40' : ''}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            {importing ? 'Importing...' : 'Import Backup'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".news2bak"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
            />
          </label>
        </div>

        {message && (
          <div className={`mt-3 rounded-xl p-3 text-xs font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
      </section>

      {/* Ward-to-ward transfer */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-sm font-semibold text-[#0B1E36]">Transfer Between Wards</h2>
        <p className="mb-4 text-xs text-slate-400">
          Move patients to another ward's device — for example when a patient is transferred.
          The file is encrypted with a transfer passphrase you agree with the receiving ward
          (backups can't be used for this, as they require the same ward PIN).
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Send */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Send patients</h3>
            {patients.length === 0 ? (
              <p className="text-xs text-slate-400">No patients on this device.</p>
            ) : (
              <>
                <div className="mb-3 max-h-44 space-y-0.5 overflow-y-auto overscroll-y-contain rounded-xl border border-slate-100 p-2">
                  {patients
                    .slice()
                    .sort((a, b) => a.lastName.localeCompare(b.lastName))
                    .map((patient) => (
                      <label key={patient.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={transferSelected.has(patient.id)}
                          onChange={() => toggleTransferPatient(patient.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#00AEEF] focus:ring-[#00AEEF]"
                        />
                        <span className="truncate text-sm text-[#0B1E36]">
                          {patient.lastName}, {patient.firstName}
                        </span>
                      </label>
                    ))}
                </div>
                <input
                  type="password"
                  value={sendPass}
                  onChange={(e) => setSendPass(e.target.value)}
                  placeholder={`Transfer passphrase (min ${MIN_TRANSFER_PASSPHRASE_LENGTH} characters)`}
                  autoComplete="off"
                  className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
                />
                <button
                  onClick={handleTransferExport}
                  disabled={transferBusy !== null || transferSelected.size === 0 || sendPass.length < MIN_TRANSFER_PASSPHRASE_LENGTH}
                  className="w-full rounded-xl bg-[#0B1E36] px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-40"
                >
                  {transferBusy === 'send'
                    ? 'Creating transfer file...'
                    : `Create Transfer File${transferSelected.size > 0 ? ` (${transferSelected.size})` : ''}`}
                </button>
              </>
            )}
          </div>

          {/* Receive */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Receive patients</h3>
            <p className="mb-3 text-xs text-slate-400">
              Enter the passphrase agreed with the sending ward, then choose their transfer file.
              Incoming patients join this ward; existing records are never overwritten.
            </p>
            <input
              type="password"
              value={receivePass}
              onChange={(e) => setReceivePass(e.target.value)}
              placeholder="Transfer passphrase"
              autoComplete="off"
              className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
            />
            <label
              className={`flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium shadow-sm transition-all ${
                transferBusy !== null || receivePass.length < MIN_TRANSFER_PASSPHRASE_LENGTH
                  ? 'cursor-not-allowed text-slate-300'
                  : 'cursor-pointer text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              {transferBusy === 'receive' ? 'Importing...' : 'Choose Transfer File'}
              <input
                ref={transferFileRef}
                type="file"
                accept=".news2transfer"
                className="hidden"
                disabled={transferBusy !== null || receivePass.length < MIN_TRANSFER_PASSPHRASE_LENGTH}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleTransferImport(file);
                }}
              />
            </label>
          </div>
        </div>

        {transferMsg && (
          <div className={`mt-4 rounded-xl p-3 text-xs font-medium ${
            transferMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {transferMsg.text}
          </div>
        )}
      </section>

      {/* Individual Patient Export */}
      {patients.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-sm font-semibold text-[#0B1E36]">Export Individual Patient</h2>
          <p className="mb-4 text-xs text-slate-400">Download a CSV file for a single patient's observations.</p>

          <div className="max-h-60 space-y-1 overflow-y-auto">
            {patients
              .slice()
              .sort((a, b) => a.lastName.localeCompare(b.lastName))
              .map((patient) => {
                const obsCount = observations.filter((o) => o.patientId === patient.id).length;
                return (
                  <button
                    key={patient.id}
                    onClick={() => handleExportPatient(patient.id)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                  >
                    <div>
                      <span className="font-medium text-[#0B1E36]">{patient.lastName}, {patient.firstName}</span>
                      <span className="ml-2 text-xs text-slate-400">{obsCount} obs</span>
                    </div>
                    <svg className="h-4 w-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                  </button>
                );
              })}
          </div>
        </section>
      )}

      {/* Security info */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-sm font-semibold text-[#0B1E36]">Security</h2>
        <div className="space-y-2 text-xs text-slate-500">
          <p>All clinical data is encrypted with AES-256-GCM before storage.</p>
          <p>Auto-lock activates after 5 minutes of inactivity.</p>
          <p>Encryption key is derived from your ward PIN and never stored.</p>
          <p>Data remains on this device only — nothing is sent to any server.</p>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-sm font-semibold text-red-600">Danger Zone</h2>
        <p className="mb-4 text-xs text-slate-400">This will permanently delete all data on this device.</p>

        {confirmReset ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="rounded-xl bg-red-500 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-red-600"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-500 transition-all hover:border-slate-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="rounded-xl border border-red-200 px-5 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-50"
          >
            Reset App & Delete All Data
          </button>
        )}
      </section>
    </div>
  );
}

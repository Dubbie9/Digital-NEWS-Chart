// ─── Backup & Restore ──────────────────────────────────────────────
// Exports all data as an encrypted file. Imports require the same
// PIN (same encryption key) to decrypt.

import { encrypt, decrypt, type EncryptedPayload } from '@/lib/crypto';
import { patientRepo, observationRepo, wardRepo } from '@/lib/repositories';
import { readAuditLogs, type AuditLog } from '@/lib/audit';
import { PatientSchema, ObservationSchema, WardSchema } from '@/lib/validation';
import type { Patient, Observation, Ward } from '@/types';
import { db } from '@/lib/db';

interface BackupData {
  version: number;
  exportedAt: string;
  wards: Ward[];
  patients: Patient[];
  observations: Observation[];
  auditLogs: AuditLog[];
}

export interface ImportResult {
  patients: number;
  observations: number;
  wards: number;
}

// ─── Export ─────────────────────────────────────────────────────────

export async function exportBackup(key: CryptoKey): Promise<Blob> {
  const [wards, patients, observations, auditLogs] = await Promise.all([
    wardRepo.getAll(key),
    patientRepo.getAll(key),
    observationRepo.getAll(key),
    readAuditLogs(key),
  ]);

  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    wards,
    patients,
    observations,
    auditLogs,
  };

  // Encrypt the entire bundle
  const payload = await encrypt(key, data);
  const json = JSON.stringify(payload);

  return new Blob([json], { type: 'application/octet-stream' });
}

export function downloadBackup(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NEWS2_Backup_${new Date().toISOString().slice(0, 10)}.news2bak`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import ─────────────────────────────────────────────────────────

export async function importBackup(
  key: CryptoKey,
  file: File,
): Promise<ImportResult> {
  const text = await file.text();
  const payload: EncryptedPayload = JSON.parse(text);

  // Decrypt
  const data = await decrypt<BackupData>(key, payload);

  if (data.version !== 1) {
    throw new Error(`Unsupported backup version: ${data.version}`);
  }

  // Validate and store wards
  for (const ward of data.wards) {
    WardSchema.parse(ward);
    const existing = await db.wards.get(ward.id);
    if (!existing) {
      await wardRepo.create(key, ward);
    }
  }

  // Validate and store patients (upsert)
  for (const patient of data.patients) {
    PatientSchema.parse(patient);
    await patientRepo.create(key, patient);
  }

  // Validate and store observations (upsert)
  for (const obs of data.observations) {
    ObservationSchema.parse(obs);
    await observationRepo.create(key, obs);
  }

  return {
    wards: data.wards.length,
    patients: data.patients.length,
    observations: data.observations.length,
  };
}

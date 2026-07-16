// ─── Ward-to-Ward Patient Transfer ──────────────────────────────────
// Moves selected patients (and all their observations) between ward
// devices that use different PINs. Full backups can only be restored
// with the same PIN, so they cannot cross wards; transfer files are
// instead sealed with a one-off passphrase (PBKDF2 → AES-GCM, fresh
// salt per file) agreed between the two wards. Data is therefore never
// readable in transit, and the receiving device re-encrypts everything
// with its own ward key on import.

import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  saltToBase64,
  saltFromBase64,
  type EncryptedPayload,
} from '@/lib/crypto';
import { patientRepo, observationRepo } from '@/lib/repositories';
import { PatientSchema, ObservationSchema } from '@/lib/validation';
import { db } from '@/lib/db';
import type { Patient, Observation } from '@/types';

export const MIN_TRANSFER_PASSPHRASE_LENGTH = 8;

const TRANSFER_FORMAT = 'news2-transfer';

interface TransferEnvelope {
  format: typeof TRANSFER_FORMAT;
  version: 1;
  salt: string; // base64 PBKDF2 salt for the transfer passphrase (not secret)
  payload: EncryptedPayload;
}

interface TransferData {
  exportedAt: string;
  sourceHospital: string;
  sourceWard: string;
  patients: Patient[];
  observations: Observation[];
}

export interface TransferImportResult {
  patients: number;
  observations: number;
  sourceWard: string;
}

// ─── Export (sending ward) ──────────────────────────────────────────

export async function exportTransferFile(
  passphrase: string,
  patients: Patient[],
  observations: Observation[],
  source: { hospital: string; ward: string },
): Promise<Blob> {
  const salt = generateSalt();
  const key = await deriveKey(passphrase, salt);

  const data: TransferData = {
    exportedAt: new Date().toISOString(),
    sourceHospital: source.hospital,
    sourceWard: source.ward,
    patients,
    observations,
  };

  const envelope: TransferEnvelope = {
    format: TRANSFER_FORMAT,
    version: 1,
    salt: saltToBase64(salt),
    payload: await encrypt(key, data),
  };

  return new Blob([JSON.stringify(envelope)], { type: 'application/octet-stream' });
}

export function downloadTransferFile(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NEWS2_Transfer_${new Date().toISOString().slice(0, 10)}.news2transfer`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import (receiving ward) ────────────────────────────────────────

/** Decrypt a transfer envelope with the shared passphrase. Throws on a
 *  wrong passphrase (AES-GCM authentication fails) or malformed file. */
export async function decryptTransferFile(
  passphrase: string,
  fileText: string,
): Promise<TransferData> {
  const envelope = JSON.parse(fileText) as TransferEnvelope;
  if (envelope.format !== TRANSFER_FORMAT || envelope.version !== 1) {
    throw new Error('Not a NEWS2 transfer file');
  }
  const key = await deriveKey(passphrase, saltFromBase64(envelope.salt));
  return decrypt<TransferData>(key, envelope.payload);
}

/**
 * Import a transfer file into this ward: validates every record, assigns
 * incoming patients to the local ward, and re-encrypts with the local
 * ward key. Merge semantics — records whose IDs already exist are skipped.
 */
export async function importTransferFile(
  passphrase: string,
  file: File,
  localKey: CryptoKey,
  localWardId?: string,
): Promise<TransferImportResult> {
  const data = await decryptTransferFile(passphrase, await file.text());

  let patientsImported = 0;
  for (const patient of data.patients) {
    const incoming = localWardId ? { ...patient, wardId: localWardId } : patient;
    PatientSchema.parse(incoming);
    const existing = await db.patients.get(incoming.id);
    if (!existing) {
      await patientRepo.create(localKey, incoming);
      patientsImported++;
    }
  }

  let observationsImported = 0;
  for (const obs of data.observations) {
    ObservationSchema.parse(obs);
    const existing = await db.observations.get(obs.id);
    if (!existing) {
      await observationRepo.create(localKey, obs);
      observationsImported++;
    }
  }

  return {
    patients: patientsImported,
    observations: observationsImported,
    sourceWard: data.sourceWard,
  };
}

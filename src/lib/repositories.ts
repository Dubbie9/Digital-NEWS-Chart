// ─── Repository Layer ──────────────────────────────────────────────
// CRUD operations over encrypted IndexedDB. Each method accepts a
// CryptoKey (never stored) and validates with Zod before storage.

import { db } from '@/lib/db';
import { encrypt, decrypt, type EncryptedPayload } from '@/lib/crypto';
import { PatientSchema, ObservationSchema, WardSchema } from '@/lib/validation';
import { writeAuditLog } from '@/lib/audit';
import type { Patient, Observation, Ward } from '@/types';

// ─── Ward Repository ───────────────────────────────────────────────

export const wardRepo = {
  async getAll(key: CryptoKey): Promise<Ward[]> {
    const records = await db.wards.toArray();
    const wards: Ward[] = [];
    for (const record of records) {
      try {
        const payload: EncryptedPayload = JSON.parse(record.encrypted);
        const ward = await decrypt<Ward>(key, payload);
        wards.push(ward);
      } catch {
        // Skip corrupted records
      }
    }
    return wards;
  },

  async create(key: CryptoKey, ward: Ward, staffName?: string): Promise<void> {
    WardSchema.parse(ward);
    const payload = await encrypt(key, ward);
    await db.wards.put({ id: ward.id, encrypted: JSON.stringify(payload) });
    if (staffName) {
      await writeAuditLog(key, 'create_patient', staffName, `Ward created: ${ward.name}`);
    }
  },
};

// ─── Patient Repository ────────────────────────────────────────────

export const patientRepo = {
  async getAll(key: CryptoKey): Promise<Patient[]> {
    const records = await db.patients.toArray();
    const patients: Patient[] = [];
    for (const record of records) {
      try {
        const payload: EncryptedPayload = JSON.parse(record.encrypted);
        const patient = await decrypt<Patient>(key, payload);
        patients.push(patient);
      } catch {
        // Skip corrupted records
      }
    }
    return patients;
  },

  async getById(key: CryptoKey, id: string): Promise<Patient | undefined> {
    const record = await db.patients.get(id);
    if (!record) return undefined;
    const payload: EncryptedPayload = JSON.parse(record.encrypted);
    return decrypt<Patient>(key, payload);
  },

  async create(key: CryptoKey, patient: Patient, staffName?: string): Promise<void> {
    PatientSchema.parse(patient);
    const payload = await encrypt(key, patient);
    await db.patients.put({ id: patient.id, encrypted: JSON.stringify(payload) });
    if (staffName) {
      await writeAuditLog(key, 'create_patient', staffName, `Patient: ${patient.lastName}, ${patient.firstName}`);
    }
  },

  async update(key: CryptoKey, patient: Patient, staffName?: string): Promise<void> {
    PatientSchema.parse(patient);
    const payload = await encrypt(key, patient);
    await db.patients.put({ id: patient.id, encrypted: JSON.stringify(payload) });
    if (staffName) {
      await writeAuditLog(key, 'update_patient', staffName, `Patient: ${patient.lastName}, ${patient.firstName}`);
    }
  },

  async delete(key: CryptoKey, id: string, staffName?: string, patientLabel?: string): Promise<void> {
    await db.patients.delete(id);
    // Also delete associated observations
    await db.observations.where('patientId').equals(id).delete();
    if (staffName) {
      await writeAuditLog(key, 'delete_patient', staffName, `Patient: ${patientLabel ?? id}`);
    }
  },
};

// ─── Observation Repository ────────────────────────────────────────

export const observationRepo = {
  async getAll(key: CryptoKey): Promise<Observation[]> {
    const records = await db.observations.toArray();
    const observations: Observation[] = [];
    for (const record of records) {
      try {
        const payload: EncryptedPayload = JSON.parse(record.encrypted);
        const obs = await decrypt<Observation>(key, payload);
        observations.push(obs);
      } catch {
        // Skip corrupted records
      }
    }
    return observations;
  },

  async getByPatientId(key: CryptoKey, patientId: string): Promise<Observation[]> {
    const records = await db.observations.where('patientId').equals(patientId).toArray();
    const observations: Observation[] = [];
    for (const record of records) {
      try {
        const payload: EncryptedPayload = JSON.parse(record.encrypted);
        const obs = await decrypt<Observation>(key, payload);
        observations.push(obs);
      } catch {
        // Skip corrupted records
      }
    }
    return observations;
  },

  async create(key: CryptoKey, observation: Observation, staffName?: string): Promise<void> {
    ObservationSchema.parse(observation);
    const payload = await encrypt(key, observation);
    await db.observations.put({
      id: observation.id,
      patientId: observation.patientId,
      encrypted: JSON.stringify(payload),
    });
    if (staffName) {
      await writeAuditLog(
        key,
        'create_observation',
        staffName,
        `Patient: ${observation.patientId}, Score: ${observation.totalScore}`,
      );
    }
  },
};

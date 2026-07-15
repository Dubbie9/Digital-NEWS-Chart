// ─── Dexie Database Schema ─────────────────────────────────────────
// Mirrors existing types (Ward, Patient, Observation) as encrypted
// blobs with plaintext index columns for Dexie querying.

import Dexie, { type Table } from 'dexie';

// ─── Record Types ──────────────────────────────────────────────────

export interface EncryptedRecord {
  id: string;
  encrypted: string; // JSON-stringified EncryptedPayload
}

export interface EncryptedObservationRecord {
  id: string;
  patientId: string; // plaintext index for querying by patient
  encrypted: string;
}

export interface EncryptedAuditRecord {
  id: string;
  timestamp: string; // plaintext index for time-range queries
  encrypted: string;
}

export interface AuthRecord {
  id: string;        // always 'primary' (single row)
  pinHash: string;   // PBKDF2 hash for PIN verification
  pinSalt: string;   // base64 salt for PIN hashing
  keySalt: string;   // base64 salt for encryption key derivation
  wardData: string;  // JSON-stringified EncryptedPayload of Ward
  hospitalName: string; // plaintext for lock screen display
  wardName: string;     // plaintext for lock screen display
  failedAttempts?: number; // consecutive wrong PIN entries
  lockUntil?: string;      // ISO timestamp — PIN entry refused until then
}

// ─── Database ──────────────────────────────────────────────────────

class NewsDatabase extends Dexie {
  wards!: Table<EncryptedRecord>;
  patients!: Table<EncryptedRecord>;
  observations!: Table<EncryptedObservationRecord>;
  auditLogs!: Table<EncryptedAuditRecord>;
  auth!: Table<AuthRecord>;

  constructor() {
    super('news2-chart');
    this.version(2).stores({
      wards: 'id',
      patients: 'id',
      observations: 'id, patientId',
      auditLogs: 'id, timestamp',
      auth: 'id',
    });
  }
}

export const db = new NewsDatabase();

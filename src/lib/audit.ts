// ─── Audit Logging ─────────────────────────────────────────────────
// Encrypted audit trail for all sensitive actions.
// Logs are stored locally in IndexedDB alongside clinical data.

import { db } from '@/lib/db';
import { encrypt, decrypt, type EncryptedPayload } from '@/lib/crypto';
import type { AuditAction } from '@/lib/validation';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  staffName: string;
  details?: string;
}

export async function writeAuditLog(
  key: CryptoKey,
  action: AuditAction,
  staffName: string,
  details?: string,
): Promise<void> {
  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    action,
    staffName,
    details,
  };

  const payload = await encrypt(key, log);

  await db.auditLogs.put({
    id: log.id,
    timestamp: log.timestamp,
    encrypted: JSON.stringify(payload),
  });
}

export async function readAuditLogs(
  key: CryptoKey,
  options?: { from?: string; to?: string; limit?: number },
): Promise<AuditLog[]> {
  let collection = db.auditLogs.orderBy('timestamp').reverse();

  if (options?.from) {
    collection = db.auditLogs
      .where('timestamp')
      .aboveOrEqual(options.from)
      .reverse();
  }

  const records = options?.limit
    ? await collection.limit(options.limit).toArray()
    : await collection.toArray();

  // Filter by 'to' date if provided
  const filtered = options?.to
    ? records.filter((r) => r.timestamp <= options.to!)
    : records;

  const logs: AuditLog[] = [];
  for (const record of filtered) {
    try {
      const payload: EncryptedPayload = JSON.parse(record.encrypted);
      const log = await decrypt<AuditLog>(key, payload);
      logs.push(log);
    } catch {
      // Skip corrupted records
    }
  }

  return logs;
}

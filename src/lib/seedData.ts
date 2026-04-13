// ─── Demo Data Seeder ──────────────────────────────────────────────
// Encrypts and stores mock data into IndexedDB. Only used when the
// user explicitly requests demo data (e.g. for evaluation).

import { MOCK_PATIENTS, MOCK_OBSERVATIONS } from '@/lib/mockData';
import { patientRepo, observationRepo } from '@/lib/repositories';

export async function seedDemoData(cryptoKey: CryptoKey): Promise<{ patients: number; observations: number }> {
  // Store all patients
  for (const patient of MOCK_PATIENTS) {
    await patientRepo.create(cryptoKey, patient);
  }

  // Store all observations
  for (const obs of MOCK_OBSERVATIONS) {
    await observationRepo.create(cryptoKey, obs);
  }

  return {
    patients: MOCK_PATIENTS.length,
    observations: MOCK_OBSERVATIONS.length,
  };
}
